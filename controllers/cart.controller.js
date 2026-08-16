import CartProductModel from "../models/cartProduct.modal.js";
import ProductModel from "../models/product.modal.js";
import GroceryProduct from "../models/groceryProduct.model.js";
import RestaurantItem from "../models/restaurantItem.model.js";
import GroceryShop from "../models/groceryShop.model.js";
import Restaurant from "../models/restaurant.model.js";
import { resolveCoordPair } from "../utils/geoCoords.js";

const getImageFromSelectedColor = (
  product = {},
  color = "",
  colorCode = "",
) => {
  const selectedColor = (product.colorOptions || []).find((option) => {
    const isNameMatch =
      color && option?.name?.toLowerCase() === color.toLowerCase();
    const isCodeMatch =
      colorCode && option?.code?.toLowerCase() === colorCode.toLowerCase();

    return isNameMatch || isCodeMatch;
  });

  if (selectedColor?.images?.length) {
    return selectedColor.images[0];
  }

  if (product?.images?.length) {
    return product.images[0];
  }

  return "";
};

export const addToCartItemController = async (request, response) => {
  try {
    const userId = request.userId; //middleware
    const {
      productTitle,
      image,
      rating,
      price,
      oldPrice,
      quantity,
      subTotal,
      productId,
      countInStock,
      discount,
      size,
      weight,
      ram,
      brand,
      color,
      colorCode,
      selectedOptions,
      source,
      shopId: bodyShopId,
      restaurantId: bodyRestaurantId,
      marketId,
      goMarketKind,
      sellerId,
    } = request.body;
    if (!productId) {
      return response.status(402).json({
        message: "Provide productId",
        error: true,
        success: false,
      });
    }

    const checkItemCart = await CartProductModel.findOne({
      userId: userId,
      productId: productId,
      size: size || null,
      weight: weight || null,
      ram: ram || null,
      color: color || "",
      selectedOptions: selectedOptions || {},
    });

    if (checkItemCart) {
      return response.status(400).json({
        message: "Item already in cart",
      });
    }

    const normalizedSource = String(source || "").toLowerCase();
    const isGoMarketSource =
      normalizedSource.includes("gomarket") ||
      normalizedSource.includes("go-market") ||
      Boolean(bodyShopId || bodyRestaurantId || goMarketKind);

    const productDetails = isGoMarketSource
      ? null
      : await ProductModel.findById(productId)
          .select("images colorOptions seller")
          .populate({
            path: "seller",
            select: "storeProfile",
            populate: {
              path: "storeProfile.marketId",
              select: "latitude longitude",
            },
          });

    let selectedImage = image || getImageFromSelectedColor(productDetails, color, colorCode);

    if (!selectedImage && isGoMarketSource) {
      const [groceryProduct, restaurantProduct] = await Promise.all([
        GroceryProduct.findById(productId).select("images image").lean(),
        RestaurantItem.findById(productId).select("images image").lean(),
      ]);
      const goMarketProduct = groceryProduct || restaurantProduct;
      selectedImage =
        goMarketProduct?.images?.[0] ||
        goMarketProduct?.image ||
        image ||
        "";
    }

    if (!selectedImage) {
      return response.status(400).json({
        message: "Product image not found",
        error: true,
        success: false,
      });
    }

    // Resolve shop/restaurant coordinates for Go Market and seller products
    let shopId = bodyShopId || "";
    let restaurantId = bodyRestaurantId || "";
    let shopLatitude;
    let shopLongitude;
    let restaurantLatitude;
    let restaurantLongitude;

    if (bodyShopId) {
      const shop = await GroceryShop.findById(bodyShopId)
        .populate("marketId", "latitude longitude")
        .lean();
      if (shop) {
        shopId = String(shop._id);
        const coords = resolveCoordPair(
          shop.latitude,
          shop.longitude,
          shop.marketId?.latitude,
          shop.marketId?.longitude,
        );
        if (coords?.lat != null && coords?.lng != null) {
          shopLatitude = coords.lat;
          shopLongitude = coords.lng;
        }
      }
    }

    if (bodyRestaurantId) {
      const restaurant = await Restaurant.findById(bodyRestaurantId)
        .populate("marketId", "latitude longitude")
        .lean();
      if (restaurant) {
        restaurantId = String(restaurant._id);
        const coords = resolveCoordPair(
          restaurant.latitude,
          restaurant.longitude,
          restaurant.marketId?.latitude,
          restaurant.marketId?.longitude,
        );
        if (coords?.lat != null && coords?.lng != null) {
          restaurantLatitude = coords.lat;
          restaurantLongitude = coords.lng;
        }
      }
    }

    if (productDetails?.seller?.storeProfile) {
      const storeProfile = productDetails.seller.storeProfile;

      if (storeProfile.marketId && !shopLatitude) {
        shopId = shopId || String(productDetails.seller._id);
        shopLatitude = storeProfile.marketId.latitude;
        shopLongitude = storeProfile.marketId.longitude;
      }

      if (storeProfile.marketId && normalizedSource.includes("restaurant") && !restaurantLatitude) {
        restaurantId = restaurantId || String(productDetails.seller._id);
        restaurantLatitude = storeProfile.marketId.latitude;
        restaurantLongitude = storeProfile.marketId.longitude;
      }
    }

    const cartItem = new CartProductModel({
      productTitle: productTitle,
      image: selectedImage,
      rating: rating,
      price: price,
      oldPrice: oldPrice,
      quantity: quantity,
      subTotal: subTotal,
      productId: productId,
      countInStock: countInStock,
      userId: userId,
      brand: brand,
      discount: discount,
      size: size,
      weight: weight,
      ram: ram,
      color: color,
      colorCode: colorCode,
      selectedOptions: selectedOptions || {},
      source: source || (isGoMarketSource ? "goMarket" : ""),
      shopId: shopId || "",
      shopLatitude: shopLatitude,
      shopLongitude: shopLongitude,
      restaurantId: restaurantId || "",
      restaurantLatitude: restaurantLatitude,
      restaurantLongitude: restaurantLongitude,
    });

    const save = await cartItem.save();

    return response.status(200).json({
      data: save,
      message: "Item add successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const getCartItemController = async (request, response) => {
  try {
    const userId = request.userId;

    const cartItems = await CartProductModel.find({
      userId: userId,
    });

    return response.json({
      data: cartItems,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const updateCartItemQtyController = async (request, response) => {
  try {
    const userId = request.userId;
    const { _id, qty, subTotal, size, weight, ram, color, colorCode, image } =
      request.body;

    if (!_id || !qty) {
      return response.status(400).json({
        message: "provide _id, qty",
      });
    }

    const existingCartItem = await CartProductModel.findOne({
      _id: _id,
      userId: userId,
    });

    if (!existingCartItem) {
      return response.status(404).json({
        message: "Cart item not found",
        error: true,
        success: false,
      });
    }

    const productDetails = await ProductModel.findById(
      existingCartItem.productId,
    ).select("images colorOptions");
    const resolvedImage =
      image ||
      getImageFromSelectedColor(productDetails, color, colorCode) ||
      existingCartItem.image;

    const updateCartitem = await CartProductModel.updateOne(
      {
        _id: _id,
        userId: userId,
      },
      {
        quantity: qty,
        subTotal: subTotal,
        size: size,
        ram: ram,
        weight: weight,
        color: color,
        colorCode: colorCode,
        image: resolvedImage,
      },
      { new: true },
    );

    return response.json({
      message: "Update cart item",
      success: true,
      error: false,
      data: updateCartitem,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const deleteCartItemQtyController = async (request, response) => {
  try {
    const userId = request.userId; // middleware
    const { id } = request.params;

    console.log("🗑️ Delete cart request - userId:", userId, "itemId:", id);
    console.log("📋 Request params:", request.params);
    console.log("📋 Request headers:", request.headers.authorization);

    if (!id) {
      console.log("❌ No ID provided");
      return response.status(400).json({
        message: "Provide _id",
        error: true,
        success: false,
      });
    }

    // Check if item exists first
    const existingItem = await CartProductModel.findOne({
      _id: id,
      userId: userId,
    });

    console.log("🔍 Existing item:", existingItem ? "Found" : "Not found");

    if (!existingItem) {
      return response.status(404).json({
        message: "The product in the cart is not found",
        error: true,
        success: false,
      });
    }

    const deleteCartItem = await CartProductModel.deleteOne({
      _id: id,
      userId: userId,
    });

    console.log("📦 Delete result:", deleteCartItem);

    if (deleteCartItem.deletedCount === 0) {
      return response.status(404).json({
        message: "The product in the cart could not be deleted",
        error: true,
        success: false,
      });
    }

    console.log("✅ Item deleted successfully");
    return response.status(200).json({
      message: "Item removed",
      error: false,
      success: true,
      data: deleteCartItem,
    });
  } catch (error) {
    console.error("❌ Delete cart error:", error);
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const emptyCartController = async (request, response) => {
  try {
    const userId = request.params.id; // middlewar

    await CartProductModel.deleteMany({ userId: userId });

    return response.status(200).json({
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};
