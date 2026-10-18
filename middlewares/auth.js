import jwt from 'jsonwebtoken'
import UserModel from '../models/user.model.js'

const auth = async(request,response,next)=>{
    try {
        const token = request.cookies.accessToken || request?.headers?.authorization?.split(" ")[1];

        // if(!token){
        //    token = request.query.token; 
        // }

        if(!token){
            return response.status(401).json({
                message : "Provide token"
            })
        }

        const decode = await jwt.verify(token,process.env.SECRET_KEY_ACCESS_TOKEN);

        if(!decode){
            return response.status(401).json({
                message : "unauthorized access",
                error : true,
                success : false
            })
        }

        request.userId = decode.id

        const user = await UserModel.findById(decode.id).select('role status email name').lean();
        if (!user) {
            return response.status(401).json({
                message: 'User not found',
                error: true,
                success: false,
            });
        }
        if (user.status !== 'Active') {
            return response.status(403).json({
                message: 'Account is not active',
                error: true,
                success: false,
            });
        }
        request.currentUser = user;

        next()

    } catch (error) {
        if (
            error?.name === 'TokenExpiredError' ||
            error?.name === 'JsonWebTokenError' ||
            error?.name === 'NotBeforeError'
        ) {
            return response.status(401).json({
                message: 'Access token is invalid or expired',
                error: true,
                success: false,
            });
        }

        return response.status(500).json({
            message: "Authentication could not be completed",
            error: true,
            success: false
        });
    }
}

export default auth