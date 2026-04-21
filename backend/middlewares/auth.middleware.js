const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

exports.isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findOne({
      _id: decoded.userId,
      isDeleted: false
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found"
      });
    }

    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or Expired Token"
    });
  }
};

// const jwt = require("jsonwebtoken");

// exports.isAuth = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET
//     );

//     req.user = decoded;
//     next();

//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or Expired Token"
//     });
//   }
// };