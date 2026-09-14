import mongoose from "mongoose";
import ProductModel from "../models/product.modal.js";
import ReviewModel from "../models/reviews.model.js";

const productReviewMatch = (productId) => ({
  productId: String(productId),
  $or: [
    { targetType: "product" },
    { targetType: { $exists: false } },
    { targetType: "" },
    { targetType: null },
  ],
});

let invalidateProductCache = () => {};

export function setProductRatingCacheInvalidator(fn) {
  if (typeof fn === "function") invalidateProductCache = fn;
}

export function toRatingNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return parseFloat(n.toFixed(1));
}

export function applyUserRatingFields(product) {
  if (!product || typeof product !== "object") return product;
  const numReviews = Number(product.numReviews || 0);
  if (numReviews <= 0) {
    product.rating = 0;
    product.numReviews = 0;
  }
  return product;
}

export function applyUserRatingFieldsList(products) {
  if (!Array.isArray(products)) return products;
  products.forEach(applyUserRatingFields);
  return products;
}

export async function recalculateProductRating(productId) {
  const pid = String(productId || "");
  if (!pid) return { rating: 0, numReviews: 0 };

  const reviews = await ReviewModel.find(productReviewMatch(pid)).select("rating").lean();
  const scores = reviews
    .map((r) => Number(r.rating))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);

  const numReviews = scores.length;
  const rating = numReviews
    ? parseFloat((scores.reduce((sum, n) => sum + n, 0) / numReviews).toFixed(1))
    : 0;

  if (mongoose.Types.ObjectId.isValid(pid)) {
    await ProductModel.findByIdAndUpdate(pid, { rating, numReviews });
  }

  invalidateProductCache(pid);
  return { rating, numReviews };
}

let backfillPromise = null;

async function runProductRatingBackfill() {
  const stats = await ReviewModel.aggregate([
    {
      $match: {
        productId: { $nin: [null, ""] },
        $or: [
          { targetType: "product" },
          { targetType: { $exists: false } },
          { targetType: "" },
          { targetType: null },
        ],
      },
    },
    {
      $group: {
        _id: "$productId",
        avg: { $avg: { $toDouble: "$rating" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const ops = [];
  for (const row of stats) {
    if (!row?._id || !mongoose.Types.ObjectId.isValid(row._id)) continue;
    ops.push({
      updateOne: {
        filter: { _id: row._id },
        update: {
          $set: {
            rating: parseFloat(Number(row.avg || 0).toFixed(1)),
            numReviews: row.count || 0,
          },
        },
      },
    });
  }

  for (let i = 0; i < ops.length; i += 500) {
    await ProductModel.bulkWrite(ops.slice(i, i + 500));
  }

  const reviewedIds = stats
    .map((row) => row?._id)
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(String(id)));

  await ProductModel.updateMany(
    reviewedIds.length ? { _id: { $nin: reviewedIds } } : {},
    { $set: { rating: 0, numReviews: 0 } },
  );
}

export function backfillProductRatingsOnce() {
  if (!backfillPromise) {
    backfillPromise = runProductRatingBackfill().catch((err) => {
      backfillPromise = null;
      console.error("product rating backfill failed", err);
    });
  }
  return backfillPromise;
}
