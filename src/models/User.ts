import { Schema, model } from 'mongoose';
import { createToken } from '../lib/jwt';
import { hash, compare } from 'bcrypt';
import { create } from 'domain';
import { SignUpResponse } from '../types/SignUpResponse';
import randomString = require('random-string');

const UserSchema = new Schema({
    email: { type: String, unique: true, required: true, trim: true },
    password: { type: String, minlength: 3, required: true, trim: true },
    name: { type: String, minlength: 3, required: true, trim: true },
    isVerified: { type: Boolean, default: false },
    verifyCode: { type: String }
});

const UserModel = model('User', UserSchema);

export class User extends UserModel {
    email: string;
    password: string;
    name: string;
    verifyCode: string;
    isVerified: boolean;

    static async signUp(email: string, password: string, name: string): Promise<SignUpResponse> {
        const encrypted = await hash(password, 8);
        const user = new User({ email, password: encrypted, name, verifyCode: randomString() });
        await user.save();
        const token = await createToken({ name, email });
        return {
            token,
            user: { email, name }
        }
    }

    static async signIn(email: string, password: string): Promise<SignUpResponse> {
        const user = await User.findOne({ email }) as User;
        if(!user) throw new Error('Email khong ton tai');
        const same = await compare(password, user.password);
        const { name } = user;
        if(!same) throw new Error('Sai password');
        const token = await createToken({ name, email });
        return { token, user: { email, name } };
    }

    static async verifyUser(idUser, verifyCode) {
        const user = await User.findById(idUser) as User;
        if (!user) throw new Error('User khong ton tai');
        if (verifyCode !== user.verifyCode) throw new Error('CODE sai');
        return User.findByIdAndUpdate(idUser, { isVerified: true });
    }
}
