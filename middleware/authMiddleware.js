import jwt from "jsonwebtoken";
import { User, UserDevice } from "../app/models/init.js";
import Response from "../helpers/response.js";

async function verifySocketAuthToken(token) {
    const secret_key    = process.env.JWT_SECRET_kEY || 'a12f4b9c5d6e7f8091a2b3c4d5e6f7g8091a2b3c4d5e6f7g8091a2b3c4d5e6f7';
    const decoded       = jwt.verify(token, secret_key);
    
    const userData      = await User.findOne({
        where:{
            id: decoded.user_id
        }
    });
    const user  = userData.toJSON();
    return user;
}

async function verifyAuthToken(req, res, next) {
    const bearerHeader      = req.header('Authorization');
    if (typeof bearerHeader !== "undefined") {
        const token = bearerHeader.split(" ")[1];
        const secret_key    = process.env.JWT_SECRET_kEY || 'a12f4b9c5d6e7f8091a2b3c4d5e6f7g8091a2b3c4d5e6f7g8091a2b3c4d5e6f7';
        if (!token){
            return res.status(401).json({ 
                "error": {
                    "code": 401,
                    "messages": [
                        "Unauthenticated"
                    ],
                    "status": false
                }
            });
        };
        try {
            const decoded = jwt.verify(token, secret_key);

            const userData = await UserDevice.findOne({
                where:{
                    "access_token": token
                }
            });
            if(!userData){
                return res.status(401).json({ 
                    "error": {
                        "code": 401,
                        "messages": [
                            "Unauthenticated"
                        ],
                        "status": false
                    }
                });
            }
            
            const user = await User.findOne({
                where:{
                    id: decoded.user_id
                }
            });
            req.user = user;
            
            next();
        } catch (error) {
            console.error("Error", error);
            return res.status(401).json({ 
                "error": {
                    "code": 401,
                    "messages": [
                        "Unauthenticated"
                    ],
                    "status": false
                }
            });
        }
    }
}

async function globalResponse(req, res, next) {
    res.responseInstance = new Response(req, res);
    next();
}

export default {
    verifySocketAuthToken,
    verifyAuthToken,
    globalResponse
}