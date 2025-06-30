
// Success Response
export const success = (res, data, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        data,
    });
}

// Error Response
export const error = (res, { code = 'SERVER_ERROR', message = 'Something went wrong', status = 500, details = {} }) => {
    return res.status(status).json({
        success: false,
        code,
        message,
        details
    })
}