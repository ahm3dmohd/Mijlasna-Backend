
function authorize(...roles) {
    return (req, res) => {
        if (!roles.includes(req.user.role)) {
            return res.response(403).json({ err: "Not allowed!!"})
        }
        next()
    }
}

module.exports = authorize