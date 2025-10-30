import { Op } from "sequelize";
import { User, UserDevice } from "../models/init.js";
import jwt from "jsonwebtoken";
import media from "../../utils/media.js";
import { decrypt } from "../../helpers/decrypt.js";

const generateOTP = () => 999999; // Math.floor(100000 + Math.random() * 900000).toString();

const checkSession = async (req, res) => {
  const { phone } = req.body;
  try {
    if (!phone) {
      return res.responseInstance.handle(null, 400, [
        "Phone number is required.",
      ]);
    }
    let user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.responseInstance.handle(null, 404, [
        "User does not exist.",
      ]);
    }

    let userDevices = await UserDevice.findAll({ where: { user_id: user?.id } });

    if (userDevices.length > 0) {
      return res.responseInstance.handle({
        exists: true,
        devices: await UserDevice.findAll({ where: { user_id: user.id } })
      }, 200, [
        "User session exists.",
      ]);
    } else {
      return res.responseInstance.handle({ exists: false, devices: [] }, 200, [
        "No existing user session.",
      ]);
    }
  } catch (err) {
    return res.responseInstance.handle(
      null,
      500,
      ["An unexpected error occurred while checking session."],
      err.message
    );
  }
}

const login = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.responseInstance.handle(null, 400, [
        "Phone number is required.",
      ]);
    }

    let user = await User.findOne({ where: { phone } });
    if (!user) {
      user = await User.create({ phone });
    }
    // check user is logged in or not by checking user device table
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);

    await User.update(
      {
        otp,
        expired_at: otpExpiry,
      },
      {
        where: {
          id: user.id,
        },
      }
    );

    return res.responseInstance.handle({}, 200, ["OTP sent successfully."]);
  } catch (err) {
    return res.responseInstance.handle(
      null,
      500,
      ["An unexpected error occurred while proceeding your request."],
      err.message
    );
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { phone, otp, device_token, device_type, voip_token, device_brand, device_os } = req.body;
    const secret_key =
      process.env.JWT_SECRET_kEY ||
      "a12f4b9c5d6e7f8091a2b3c4d5e6f7g8091a2b3c4d5e6f7g8091a2b3c4d5e6f7";

    if (!phone || !otp) {
      return res.responseInstance.handle(null, 400, [
        "Phone number and OTP are required.",
      ]);
    }

    const user = await User.findOne({ where: { phone, otp } });
    if (!user) {
      return res.responseInstance.handle(null, 400, [
        "Invalid phone number or OTP.",
      ]);
    }
    await UserDevice.destroy({ where: { user_id: user.id } });
    // const now = new Date();
    // if (user.expiredAt < now) {
    //     return res.responseInstance.handle(null, 400, ["OTP has expired."]);
    // }

    await User.update(
      {
        otp: null,
        expiredAt: null,
      },
      {
        where: {
          id: user.id,
        },
      }
    );

    const token = jwt.sign({ user_id: user.id }, secret_key);

    if (device_token && device_type) {
      await UserDevice.upsert({
        user_id: user.id,
        device_token,
        device_type,
        device_brand,
        device_os,
        access_token: token,
        voip_token: voip_token,
      });
    }

    const userData = user.toJSON();

    return res.responseInstance.handle({ user: { ...userData, token } }, 200, [
      "OTP verified successfully.",
    ]);
  } catch (err) {
    return res.responseInstance.handle(
      null,
      500,
      ["An unexpected error occurred while proceeding your request."],
      err.message
    );
  }
};

const userUpdate = async (req, res) => {
  try {
    console.log('--------- start req -----------');
    console.log(req.body);
    console.log('--------- end req -----------');
    const { full_name, bio, email, language } = req.body;
    const params = {};

    if (full_name != null) params.full_name = full_name;
    if (bio != null) params.bio = bio;
    if (email != null) {
      const emailExists = await User.findOne({
        where: { email, id: { [Op.ne]: req.user.id } }, // Ensure it's not the current user's email
      });
      if (emailExists) {
        return res.responseInstance.handle(null, 409, [
          "Email already in use.",
        ]);
      }

      params.email = email;
    }
    if (language != null) params.language = language;

    if (req?.files?.profile_image != null) {
      let profile_image = await media.uploadMediaWithFallback(req, "user", "profile_image", process.env.USE_S3_UPLOAD === "true");
      params.profile_image = profile_image;
    }

    await User.update(params, {
      where: { id: req.user.id },
      lock: true,
      transaction: null,
    });

    const user = await User.findOne({ where: { id: req.user.id } });
    return res.responseInstance.handle({ user }, 200, [
      "User updated successfully.",
    ]);
  } catch (err) {
    return res.responseInstance.handle(
      null,
      500,
      ["An unexpected error occurred while updating user."],
      err.message
    );
  }
};

const changeNumber = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.responseInstance.handle(null, 400, [
        "Phone number is required.",
      ]);
    }

    let NumberExist = await User.findOne({ where: { phone } });
    if (NumberExist) {
      return res.responseInstance.handle(null, 400, [
        "Phone number is Already Exist.",
      ]);
    }

    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);

    await User.update(
      {
        otp,
        expired_at: otpExpiry,
      },
      {
        where: {
          id: req.user.id,
        },
      }
    );

    return res.responseInstance.handle({}, 200, ["OTP sent successfully."]);
  } catch (err) {
    return res.responseInstance.handle(
      null,
      500,
      ["An unexpected error occurred while proceeding your request."],
      err.message
    );
  }
};

const changeNumberOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.responseInstance.handle(null, 400, [
        "Phone number and OTP are required.",
      ]);
    }

    const user = await User.findOne({
      where: {
        id: req.user.id,
        otp,
      },
    });

    if (!user) {
      return res.responseInstance.handle(null, 400, [
        "Invalid phone number or OTP.",
      ]);
    }

    await User.update(
      {
        phone: phone,
        otp: null,
        expiredAt: null,
      },
      {
        where: {
          id: user.id,
        },
      }
    );

    const userData = user.toJSON();

    return res.responseInstance.handle({ user: { ...userData } }, 200, [
      "OTP verified successfully.",
    ]);
  } catch (err) {
    return res.responseInstance.handle(
      null,
      500,
      ["An unexpected error occurred while proceeding your request."],
      err.message
    );
  }
};

const validateUser = async (req, res) => {
  try {
    const { phones } = req.body;

    if (!phones) {
      return res.responseInstance.handle(null, 400, [
        "Phone number's is required.",
      ]);
    }

    const phoneArray = phones.map((phone) => phone.trim());

    const key = "jRVCZmuMUEIvFb4pcdKnhQ==";

    const existUsers = await Promise.all(
      phoneArray.map(async (phone) => {
        try {
          const decryptedPhoneNumber = decrypt(phone, key);
          console.log(decryptedPhoneNumber);

          const user = await User.findOne({
            attributes: ["id", "full_name", "phone", "profile_image"],
            where: { phone: decryptedPhoneNumber },
          });

          return user ? { ...user.toJSON() } : null;
        } catch (error) {
          console.error(`Failed to process phone number: ${phone}`, error);
          return null;
        }
      })
    );

    const filteredUsers = existUsers.filter((user) => user !== null);

    return res.responseInstance.handle({ users: filteredUsers }, 200, [
      "Users fetched successfully.",
    ]);
  } catch (err) {
    return res.responseInstance.handle(
      null,
      500,
      ["An unexpected error occurred while proceeding your request."],
      err.message
    );
  }
};

const logout = async (req, res) => {
  try {
    const { device_token } = req.body;

    const bearerHeader = req.header("Authorization");
    const token = bearerHeader.split(" ")[1];

    if (!device_token) {
      return res.responseInstance.handle(null, 400, [
        "device token are required.",
      ]);
    }

    const userDevice = await UserDevice.findOne({
      where: { user_id: req.user.id, device_token, access_token: token },
    });

    if (!userDevice) {
      return res.responseInstance.handle(null, 404, ["Device not found."]);
    }

    await UserDevice.destroy({
      where: {
        id: userDevice.id,
      },
    });

    return res.responseInstance.handle(null, 200, ["Logged out successfully."]);
  } catch (err) {
    return res.responseInstance.handle(
      null,
      500,
      ["An unexpected error occurred while logging out."],
      err.message
    );
  }
};

const deleteAccount = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });

    if (!user) {
      return res.responseInstance.handle(null, 404, ["User not found."]);
    }

    const emailParts = user.email.split("@");
    const updatedEmail = `${emailParts[0]}@delete${Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000
      }.com`;
    const updatedPhone = `${user.phone}+000+${Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000
      }`;

    // Update the user's email
    await User.update(
      { email: updatedEmail, phone: updatedPhone },
      { where: { id: req.user.id } }
    );

    await User.destroy({
      where: {
        id: req.user.id,
      },
    });

    await UserDevice.destroy({ where: { user_id: req.user.id } });

    return res.responseInstance.handle(
      { status: true, message: ["Account deleted successfully."] },
      200
    );
  } catch (err) {
    return res.responseInstance.handle(
      null,
      500,
      ["An unexpected error occurred while deleting the account."],
      err.message
    );
  }
};

export default {
  checkSession,
  login,
  verifyOTP,
  userUpdate,
  changeNumber,
  changeNumberOTP,
  validateUser,
  logout,
  deleteAccount,
};
