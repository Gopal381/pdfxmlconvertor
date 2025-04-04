import users from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const register = async(req, res)=> {
    try {
        const {name, email, password} = req.body;

        if(!(name && email && password)) {
            return res.status(400).json({
                success: false,
                message: "Please enter mandat fields"
            })
        }
        const existingUser =  await users.findOne({email});
        if(existingUser) {
            return res.status(400).json({
                success: "false",
                message: "User already exist"
            })
        }

        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if(!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Invalid email format"
            })
        }

        const hashPassword = bcrypt.hashSync(password, 10);

        const user =  await users.create({
            name,
            email,
            password: hashPassword,
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user,
        });
    } catch(error) {
        console.log(error);
    }
};

const login = async (req, res) => {
    try {
        const {email, password} = req.body;
        let user = await users.findOne({email});
        if(!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: "Invalid Credentials",
            });
        }

        const token =  jwt.sign(
            {id: user._id, email: user.email},
            process.env.SECRET_KEY,
            {
                expiresIn: "1h",
            }
        )
    user = user.toObject();
    user.token = token;
    user.password = undefined;
    res.cookie("token", token, {
      secure: true,
      sameSite: "None",
      maxAge: 3600000,
    });
    res.json({
      success: true,
      token,
      user,
      message: " logged in succesfully",
    });
    } catch(e) {
        res.json({
            success: false,
            message: "Error logging in",
        });
    }
};


const logout = (req, res) => {
    res.clearCookie("token");
    res.json({ success: true, message: "Logout Successfull" });
  };


export { register, login, logout };