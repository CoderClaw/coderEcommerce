const { connect } = require('mongoose');

exports.connectDB = () => {
    connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB connected'))
    .catch(err => console.error('DB connection error:', err));
};