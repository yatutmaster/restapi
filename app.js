

const http = require('http');
const url = require('url');
const qs = require('querystring');

const jwt = require('jsonwebtoken'); 

const Users= require('./modules/users').UserModel;
const Country= require('./modules/users').CountryModel;


const jwtsecret = "mysuperpupersecretkey";

const hostname = '127.0.0.1';
const port = 3000;






const server = http.createServer((req, res) => {
	


	 switch (req.method)
	 {
		case 'GET': 
			getGet (req, res);
			break;
		case 'POST': 
			getPost (req, res);
			break;
		case 'PUT': 
		    getPut (req, res);
			break;
		case 'DELETE': 
			parseReq (req, res);
			break;
		default:
			parseReq (req, res);
			 
	 }
	 


});

server.listen(port, hostname, () => {
  console.log(`Server running at --- http://${hostname}:${port}/`);
});



function getPost (req, res)
{
	   //регистрация
	   if(req.url == '/registration')
	   {
		   	var body ='';
			
			req.setEncoding('utf8');
			
			req.on('data', (data) => {
				body +=data;
			});
			
			req.on('end', () => {
				
				body =  qs.parse(body);
				
				body = postClean(body);
				
				let user =  new Users();
				
				user.username = body.username;
				user.country = body.country;
				user.fio = body.fio;
				user.password = body.password;
				user.token = 'no token';
				
			    user.save(function (err) {
					
					if (err) {
						
						console.error(err);
						
						if(err.code === 11000)
						      result(res, "User is exists", 401);
						else
						      result(res, 'Error: '+err.message, 500);
					   
					} else {
					
						result(res, "Success");
					}
						
					
					
				});
				
				
			   
			});
	   }
	   else if(req.url == '/login')//авторизация
	   {
		   	 	var body ='';
			
				req.setEncoding('utf8');
				
				req.on('data', (data) => {
					body +=data;
				});
				
				req.on('end', () => {
				
			
					body =  qs.parse(body);
					
					(function (username, password,res) {
					
						  Users.findOne({ username: username }, (err, user) => {
							
								  if (err)
								  {
										result(res, "Error", 500);
									
								  }
								  else if (!user || !user.checkPassword(password)) 
										 result(res, "'Нет такого пользователя или пароль неверен.'", 401);
								  else {
									  let timest = Date.now();
								  
								  // информация которую мы храним в токене и можем из него получать
									  let data = {
										username: username,
										lastToken: timest,
										time:timest 
									  };
										  
									   var newToken = jwt.sign(data, jwtsecret); //
										   
									   Users.update({ username: username }, { token: data.lastToken}, (err) => {
										  
										  if (err)
										  {
												 console.log(err);
												 result(res, "Error", 500);
										  }
										  else
										  {
												 let data  = JSON.stringify({token:newToken});
												 result(res, data);
										  }
										  
									  });
								  }
							}); 
							
					  })(body.username,body.password,res);
					
					
					
					});
				
	   }
	   else result(res, "Not find", 404);
	
	    
}

function postClean(body)
{
			
	for(var i = 0; i < body.length; ++i)
				   body[i] = body[i].replace(/\r\n|\r|\n/g,"");
	return body;		   
}

function getGet (req, res)
{

       

		var url_parts = url.parse(req.url,true);
         console.log(url_parts.query);

		 if(url_parts.pathname === '/country')//список доступных стран
		 {
			  
			 let countr_obj = Country.find().select('country').exec((err,data) => {
				 
				 var buff = [];
				 
				 if(err) 
					 result (res,"Error",500);
				 else
				 {
					 for (var prop in data) {
					     buff.push(data[prop].country);
					 }	 
					 
					 result (res,JSON.stringify({list:buff}));
				 }
                    
			 });
			  
		 }
		 else if(url_parts.pathname === '/mydata')//данные пользователя
		 {
			 
		     checkToken(url_parts.query.token, (err, newToken, username) => {
				  
				  if(err) 
					   result (res ,err, 500);
				  else {
					  
					  
					   Users.findOne({ username: username}, (err2, user) => {
							
								  if (err2)
								  {
										result(res, "Error", 500);
								  }
								  else {
									
									  //возвращаем все данные
									let data  = JSON.stringify({ fio: user.fio, username:user.username, country:user.country, token:newToken});
									  
									result(res, data);
								  }
								  	  
						  }); 
							  
					  
				  }
				  
				  
			  });
		 
			 
		 }
		 else  result (res ,'Not find', 404);
		
}
function getPut (req, res)
{

      if( req.url == '/update')
      {
		  
		    var body ='';
				
			req.setEncoding('utf8');
			
			req.on('data', (data) => {
				body +=data;
			});
			
			req.on('end', () => {
				
				body =  qs.parse(body);
				
				body = postClean(body);
				
				checkToken (body.token,(err,token,username) =>{
					
					if(err)
					   result(res, err, 401);
				   else {
					   
					   if(body.country)
					   {
						   let promise = new Promise((resolve, reject) => {
								
								Country.findOne({country:body.country},(err,data) =>{
									
									if(err)
									     reject(err);
									else 
										 resolve(data);
								});
							
						
						   });
						  
							promise
							  .then(
								presult => {
								     if(!presult)  
										 result(res, JSON.stringify({token:token, err:'Эта страна не допустима, список доступных стран get:/country'}), 401); 
									 else
									{
											   updateUser (username,body,(err) => {
												
													if(err)
														  result(res, err, 500);
													else
														  result(res, JSON.stringify({token:token}));
												
												});
						   
									}   
									 
								},
								error => {
									 console.log(error);
								     result(res, 'Error', 500);
								}
							  );
						   
					   }
					   else
					   {
						    updateUser (username,body,(err) => {
								
								if(err)
									  result(res, err, 500);
								else
								      result(res, JSON.stringify({token:token}));
								
							});
						   
					   }   
					   
				    }
					
				});
				
				
			});
			 
		  
	  }
      
		
}


function updateUser (user,body,callback)
{

	
		  Users.findOne({ username:user}, function (err, doc) {
			   if (err)
			   {
					 console.log(err);
					 callback('Not find to update');
			   }
			   else 
			   {
				   
				   
				   if(body.fio) doc.fio = body.fio;
				   if(body.password) doc.password = body.password;
				   if(body.country) doc.country = body.country;
				   
				   doc.save(callback);
				   
			   }   
				   
			  
		 })
		  

								   
	  	  
	  
}

 function checkToken (token,callback)
{
	
	   let decoded = jwt.verify(token, jwtsecret);
	   
	   if(!decoded) 
	   {
		     callback('Not verify',null);
		     return false;
	   }
		 

	  
	   let last_timest = decoded.time +1000 * 60 * 5 ; // + 5 мин
	   let timest = Date.now() ; 
	   
	   if(last_timest > timest)
	   {
		     	  console.log('Токен не обновлен');
		     callback(null,token,decoded.username);
		     return true;
	   }
	 

	
	   if(last_timest < timest)//если прошло время, обновляем токен
	   {
		   
			console.log(decoded);
			Users.findOne({username:decoded.username }, (err, user) => {
							
								  console.log(token+'   '+decoded.lastToken);
							
						  if(err)
						  {
								console.log(err);
								callback('find error',null);
								
						  }
						  else if (!user) //в случае если юзера удалили
						  {
							  	 
								 console.log(user);
								 callback('User not find',null);
							  
						  }	
						  else if(user.token == decoded.lastToken) {//проверка прошлого токена
							  
								   
							  // информация которую мы храним в токене и можем из него получать
								  let data = {
									username: decoded.username,
									lastToken: token,
									time:timest
								  };
									  
								    var newtoken = jwt.sign(data, jwtsecret); //
									
									Users.update({ username:decoded.username}, { token: data.lastToken}, (err) => {
									  
									  	  console.log('Токен  обновлен');
									  
									   if (err)
									   {
											 console.log(err);
											 callback('Not update',null);
									   }
									   else callback(null,newtoken,decoded.username);
									 
								   });
								   
							  
						  }
						  else
						  {
							   callback('Bad token',null);
							   return false; //подмена токена
						  }
							 
			  }); 
	   }
}

function parseReq (req, res )
{
	
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf8');
  res.end(`Сработал метод ${req.method}`);
	
}

function result (res , mess = 'Ok\n', code = 200)
{
	
  res.statusCode = code;
  res.setHeader('Content-Length', Buffer.byteLength(mess));
  res.setHeader('Content-Type', 'text/plain; charset=utf8');
  res.end(mess);
	
}



