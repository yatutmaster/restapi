
const crypto = require('crypto');

const mongoose = require('mongoose');


mongoose.Promise = Promise;
mongoose.set('debug', true); 

mongoose.connect('mongodb://localhost/restapi');

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback () {
    console.log("Connected!")
});



const Schema = mongoose.Schema;


const userSchema = new Schema({
    username: {
        type: String,
        unique:true,
        required: true
		
    },
    country: {
        type: String,
        required: true
    },
    fio: {
        type: String,
        required:  true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});


// Оброботка пароля
userSchema.virtual('password')
	.set(function (password) {
	
		  this._plainPassword = password;
		  
		  
		  if (password) {
			this.salt = crypto.randomBytes(128).toString('base64');
			this.hashedPassword = crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha1');
			
		  } else {
			this.salt = undefined;
			this.hashedPassword = undefined;
	
		  }
	})
	.get(function () {
			return this._plainPassword;
	});
// Проверка пароля
userSchema.methods.checkPassword = function (password) {
	
   if (!password || !this.hashedPassword) return false;
   return crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha1') == this.hashedPassword;
   
};

const countrySchema = new Schema({///////////список доступных стран
    country: {
        type: String,
        unique:true,
        required: true
    }
});




const UserModel = mongoose.model('User', userSchema);
const CountryModel = mongoose.model('Country', countrySchema);

module.exports = {
	UserModel:UserModel,
	CountryModel:CountryModel
	};








