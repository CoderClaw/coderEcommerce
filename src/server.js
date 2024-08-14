const dotenv = require('dotenv').config()
const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('./config/passport');
//const config = require('./config/config');
const { connectDB } = require('./config/index');
const { requestLogger, errorLogger } = require('./middleware/logger.js');
const compression = require('compression');
const productRoutes = require('./routes/api/products.router.js');
const cartRoutes = require('./routes/api/cart.router.js');
const viewRoutes = require('./routes/views.router.js');
const authRoutes = require('./routes/authRoutes.js');
const mockingRouter = require('./routes/mockingRouter');
const { errorHandler } = require('./utils/errorHandler');

const swaggerJsDocs = require('swagger-jsdoc');
const swaggerUiExpress = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression()); // Add compression middleware

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// View engine setup
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Connect to MongoDB
connectDB();

//swagger docs
const swaggerOptions = {
  definition: {
    openapi: '3.0.1',
    info: {
      title: "documentacion",
      description: "API docs"
    }
  },
  apis: ['./docs/cart/cart.yaml']
}

const spec = swaggerJsDocs(swaggerOptions);

// Logger middleware
app.use(requestLogger);

// Route setup
app.use('/', viewRoutes);
app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);
app.use('/auth', authRoutes);
app.use('/api', mockingRouter);
app.use('/apidocs', swaggerUiExpress.serve, swaggerUiExpress.setup(spec))

// Error handling middleware
app.use(errorLogger);
app.use(errorHandler);

// Start the server
app.listen(PORT, err => {
  if (err) {
    console.log('Error:', err);
  } else {
    console.log(`Listening on port: ${PORT}`);
  }
});
