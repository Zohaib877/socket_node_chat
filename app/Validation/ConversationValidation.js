import Joi from 'joi';

const conversationValidator = Joi.object({
  users: Joi.array().items(Joi.number().exist({ table: 'users', column: 'id' })).required(),
  conversation_type: Joi.string().valid('private', 'room').required(),
  status: Joi.boolean().required(),
  title: Joi.string().optional().when('conversation_type', { is: 'room', then: Joi.required() }),
  description: Joi.string().optional().when('conversation_type', { is: 'room', then: Joi.required() }),
  image: Joi.object().optional().when('conversation_type', { is: 'room', then: Joi.required() }),
}).messages({
  'number.base': 'User not found with this ID!',
});

const validateConversation = (req, res, next) => {
  const { error, value } = conversationValidator.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((err) => err.message);
    return res.status(422).json({ errors });
  }

  req.validatedBody = value;
  next();
};

export default validateConversation;