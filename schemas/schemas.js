import Joi from "joi"

export const registerSchema = Joi.object({
     name: Joi.string().required(),
     email: Joi.string().email().required(),
     password: Joi.string().required(),
     confirmPassword: Joi.string().required()
})

export  const loginSchema = Joi.object({
     email: Joi.string().required().email(),
     password: Joi.string().required()
})

export const shortUrlSchema = Joi.object({
     url: Joi.string().required().uri()
})