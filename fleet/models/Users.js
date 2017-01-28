module.exports = {
  // Idenitity is a unique name for this model
  identity: 'users',
  connection: 'authentication',

  types: {

  },

  attributes: {
    email: {
      type: 'string',
      required: true,
      unique: true
    },

    name: {
      type: 'string',
      required: true,
      index: true
    },

    isAdmin: {
      type: 'boolean',
      required: true
    },

    password: {
      type: 'string',
      maxLength: 512,
      required: true
    },

    lastLogin: {
      type: 'json',
      required: false
    }
  }
};