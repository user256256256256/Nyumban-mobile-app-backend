import Joi from 'joi'

export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false })

    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map(err => ({
          message: err.message,
          field: err.context.key
        }))
      })
    }

    next()
  }
}
