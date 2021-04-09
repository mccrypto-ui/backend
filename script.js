const express = require("express")
const Bodyparser = require("body-parser")
const knex = require("knex")
const bcrypt= require("bcrypt-nodejs")
const cors = require("cors")

const app = express()
app.use(Bodyparser.json())
app.use(Bodyparser.urlencoded({ extended: false }))
app.use(cors())

const database = knex({
    client: 'mysql',
    // version: '15.1',
    
    connection: {  
        host : process.env.HOST,
        user : process.env.USER,
        password : process.env.PASSWORD,
        database : process.env.DATABASE,
        timezone: 'utc'
}
  });  
 
  // Server: 
  // Name: 
  // Username: 
  // Password: 
  // Port number: 3306
  // host : "sql301.unaux.com",
  //       user : "unaux_27220539",
  //       password : "sxc25f8u55d4r",
  //       database : "unaux_27220539_lens",
  //       timezone: 'utc'
app.get("/",(req,res)=>{
    res.send("hello world")
})

app.post("/user_login", (req,res)=>{
    const{email ,password} = req.body
    if (!email  || !password) {
        return res.status(400).json("incorrect form submission")
    }
  database.select('email' , "password")
  .from('user_details')
  .where('email' , "=" , email)
  .then(data =>{
    const isValid = bcrypt.compareSync(password , data[0].password)
    if (isValid) {
       return database.select('FullName',"Email" ,"Currency" ,"Role").from ('user_details')
        .where('email', '=', email)
        
        .then(user =>{
            res.status(200).json(user[0])
        })
        .then(users =>{
        database.insert
       ({
           Email: email,
           Time_LoggedIn:new Date()

        })
       .into("loggedin")
      .then(user=>{
        res.status(200).json()
        })
        .catch(err=>{
            console.log(err)
        })
        })

        .catch(err => res.status(400).json("unable to connect"))
    }else{
        res.status(400).json("Wrong credentials")
    }
  })
 
  
  .catch(err => res.status(400).json("Wrong credentials"))
})

   
app.post('/register',(req,res) =>{
    const{fullname,email,phone,country,currency,occupation,password} = req.body
    if (!fullname || !email|| !phone|| !country ||!currency||!occupation||!password) {
      return res.status(400).json("incorrect form submission")
  }
    const hash = bcrypt.hashSync(password)
    database.transaction(trx =>{
        trx.insert({
            FullName:fullname,
            Email:email,
            PhoneNumber:phone,
            Country:country,
            Currency:currency,
            Occupation:occupation,
            CreatedAt:new Date()
        })
        .into('user_info')
        .then(user =>{ 
                res.status(200).json("success")
                }) 
        .then(loginEmail =>{
            return trx('user_details')
            .insert({
                Email:email,
                FullName:fullname,
                Password:hash,
                Currency:currency,
                Role:"User"
            }) 
            })
        .then(trx.commit)
        .catch(trx.rollback)
    })
        .catch(err => res.status(400).json(err))
    
})

app.post('/register2',(req,res) =>{
    const{fullname,email,phone,password} = req.body
    if(!fullname || !email|| !phone||!password) {
      return res.status(400).json("incorrect form submission")
    }
    const hash = bcrypt.hashSync(password)
    database.transaction(trx =>{
        trx.insert({
            FullName:fullname,
            Email:email,
            PhoneNumber:phone
        })
        .into('admin')
        .then(user =>{ 
                res.status(200).json("success")
                }) 
        .then(loginEmail =>{
            return trx('user_details')
            .insert({
                Email:email,
                FullName:fullname,
                Password:hash,
                Role:"Admin"
            }) 
            })
        .then(trx.commit)
        .catch(trx.rollback)
    })
        .catch(err => res.status(400).json(err))
    
})

app.post("/invest", (req,res)=>{
    const {email,investdate,amount,period,expamount,periodinvest} = req.body

     if (!email||!investdate||!amount||!period||!expamount||!periodinvest) {
       return res.status(400).json("incorrect form submission")
  }
   
      function addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      }
      

    database('investmentdetails')
    .insert({
        Email: email,
        DateInvested: investdate,
        AmountInvested: amount,
        InvestmentPeriod : periodinvest,
        ExpectedAmount : expamount,
        MaturityDate:addDays(investdate,parseInt(period)),
        InvestmentStatus: "Pending"
    })
    .then(user =>{ 
        res.status(200).json("success")
        }) 
        .catch(err=> res.status(400).json(err))
})


app.get("/details", (req,res)=>{
    database.select('*').from("investmentdetails")
    .then(user=>{
        res.json(user)
    })
})



app.post("/dash",(req,res)=>{
    console.log(req.body.email)
    database("investmentdetails").where({
        Email: req.body.email
      }).select('*')
      .then(user =>{ 
        res.status(200).json(user)
        })
    .catch(err=>{res.status(400).json("not init")})    
    })

    app.post("/main",(req,res)=>{
        database("investmentdetails").where({
            Email: req.body.email
          }).select('*')
          .then(user =>{ 
              console.log(user)
            res.status(200).json(user)
            })
        .catch(err=>{
            res.status(400).json(err)
        })    
        })
    

        app.post("/approve" ,(req,res)=>{
          const {email,amount,date,period,expamount,maturedate} =req.body
          
            database('investmentdetails')
            .where({
              Email: email,
              DateInvested: date,
              AmountInvested: amount,
              InvestmentPeriod :period,
              ExpectedAmount : expamount,
              MaturityDate:maturedate
            })
            .then(user=>{
                const isCorrect = email === user[0].Email
                if(isCorrect){
              database("investmentdetails") 
              .where({
                Email: email,
                DateInvested: date,
                AmountInvested: amount,
                InvestmentPeriod :period,
                ExpectedAmount : expamount,
                MaturityDate:maturedate
              })     
              .update({  
            InvestmentStatus: "Approved"
           })
           .then(user =>{ 
            res.status(200).json("success")
            }) 
            .catch(err=> res.status(400).json(err))
                }
            })
             .catch(err=>{res.status(400).json(err)})
        })


        app.post("/edit" ,(req,res)=>{
            const {email,amount,period,expamount} = req.body

            function EditaddDays(date, days) {
                var result = new Date(date);
                result.setDate(result.getDate() + days);
                return result;
              }
              
              
              const EditTime =()=>{
                  let times
                  if (period === "30") {
                    times="30Days"
                  }
                  if (period === "90") {
                     times="3Months" 
                }
                if (period === "180") {
                      times="6Months"
                }
                if (period==="365") {
                    times="1Year"
                }
                return times
              }

              
        

            database('investmentdetails')
            .where('Email', email)
            .then(user=>{
                const investdate = user[0].DateInvested
                const isCorrect = email === user[0].Email
                if(isCorrect){
              database("investmentdetails") 
              .where("Email", "=", req.body.email)     
              .update({  
                AmountInvested: amount,
                InvestmentPeriod : EditTime(),
                ExpectedAmount : expamount,
                MaturityDate:EditaddDays(investdate,parseInt(period))
           })
           .then(user =>{ 
            res.status(200).json("success")
            }) 
            .catch(err=> res.status(400).json(err))
                }
            })
             .catch(err=>{res.status(400).json(err)})
        })

        app.post("/delete",(req,res)=>{
          const {email,amount,date,period,expamount,maturedate} =req.body
          database('investmentdetails')
          .where({
            Email: email,
            DateInvested: date,
            AmountInvested: amount,
            InvestmentPeriod :period,
            ExpectedAmount : expamount,
            MaturityDate:maturedate
          })
          .del()
          .then(user =>{ 
            res.status(200).json("success")
            }) 
            .catch(err=> res.status(400).json(err))
        })

        app.post("/deleteuser", (req, res) =>{
          const {email} = req.body 
          database('investmentdetails')
         .where("Email","=", email)
         .then(user=>{
          const isCorrect = email === user[0].Email
          if(isCorrect){
      database.raw(
        "DELETE user_details ,investmentdetails FROM user_details INNER JOIN investmentdetails ON investmentdetails.Email = user_details.Email  WHERE user_details.Email = ?", email)   
        .then(user =>{ 
                  res.status(200).json("user")
                  }) 
                  .catch(err=> res.status(400).json(err))  
                
              } 
          })
          .catch(err=> res.status(400).json("errorname"))  
      })


      // OTHER SITE

      app.post("/user_login1", (req,res)=>{
        const{email ,password} = req.body
        if (!email  || !password) {
            return res.status(400).json("incorrect form submission")
        }
      database.select('email' , "password")
      .from('user_details2')
      .where('email' , "=" , email)
      .then(data =>{
        const isValid = bcrypt.compareSync(password , data[0].password)
        if (isValid) {
           return database.select('FullName',"Email" ,"Currency" ,"Role").from ('user_details2')
            .where('email', '=', email)
            
            .then(user =>{
                res.status(200).json(user[0])
            })
            .then(users =>{
            database.insert
           ({
               Email: email,
               Time_LoggedIn:new Date()
    
            })
           .into("loggedin2")
          .then(user=>{
            res.status(200).json()
            })
            .catch(err=>{
                console.log(err)
            })
            })
    
            .catch(err => res.status(400).json("unable to connect"))
        }else{
            res.status(400).json("Wrong credentials")
        }
      })
     
      
      .catch(err => res.status(400).json("Wrong credentials"))
    })
    
       
    app.post('/register1',(req,res) =>{
        const{fullname,email,phone,country,currency,occupation,password} = req.body
        if (!fullname || !email|| !phone|| !country ||!currency||!occupation||!password) {
          return res.status(400).json("incorrect form submission")
      }
        const hash = bcrypt.hashSync(password)
        database.transaction(trx =>{
            trx.insert({
                FullName:fullname,
                Email:email,
                PhoneNumber:phone,
                Country:country,
                Currency:currency,
                Occupation:occupation,
                CreatedAt:new Date()
            })
            .into('user_info2')
            .then(user =>{ 
                    res.status(200).json("success")
                    }) 
            .then(loginEmail =>{
                return trx('user_details2')
                .insert({
                    Email:email,
                    FullName:fullname,
                    Password:hash,
                    Currency:currency,
                    Role:"User"
                }) 
                })
            .then(trx.commit)
            .catch(trx.rollback)
        })
            .catch(err => res.status(400).json(err))
        
    })
    
    app.post('/register12',(req,res) =>{
        const{fullname,email,phone,password} = req.body
        if(!fullname || !email|| !phone||!password) {
          return res.status(400).json("incorrect form submission")
        }
        const hash = bcrypt.hashSync(password)
        database.transaction(trx =>{
            trx.insert({
                FullName:fullname,
                Email:email,
                PhoneNumber:phone
            })
            .into('admin2')
            .then(user =>{ 
                    res.status(200).json("success")
                    }) 
            .then(loginEmail =>{
                return trx('user_details2')
                .insert({
                    Email:email,
                    FullName:fullname,
                    Password:hash,
                    Role:"Admin"
                }) 
                })
            .then(trx.commit)
            .catch(trx.rollback)
        })
            .catch(err => res.status(400).json(err))
        
    })
    
    app.post("/invest1", (req,res)=>{
        const {email,investdate,amount,period,expamount,periodinvest} = req.body
    
         if (!email||!investdate||!amount||!period||!expamount||!periodinvest) {
           return res.status(400).json("incorrect form submission")
      }
       
          function addDays(date, days) {
            var result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
          }
          
    
        database('investmentdetails2')
        .insert({
            Email: email,
            DateInvested: investdate,
            AmountInvested: amount,
            InvestmentPeriod : periodinvest,
            ExpectedAmount : expamount,
            MaturityDate:addDays(investdate,parseInt(period)),
            InvestmentStatus: "Pending"
        })
        .then(user =>{ 
            res.status(200).json("success")
            }) 
            .catch(err=> res.status(400).json(err))
    })
    
    
    app.get("/details1", (req,res)=>{
        database.select('*').from("investmentdetails2")
        .then(user=>{
            res.json(user)
        })
    })
    
    
    
    app.post("/dash1",(req,res)=>{
        console.log(req.body.email)
        database("investmentdetails2").where({
            Email: req.body.email
          }).select('*')
          .then(user =>{ 
            res.status(200).json(user)
            })
        .catch(err=>{res.status(400).json("not init")})    
        })
    
        app.post("/main1",(req,res)=>{
            database("investmentdetails2").where({
                Email: req.body.email
              }).select('*')
              .then(user =>{ 
                  console.log(user)
                res.status(200).json(user)
                })
            .catch(err=>{
                res.status(400).json(err)
            })    
            })
        
    
            app.post("/approve1" ,(req,res)=>{
              const {email,amount,date,period,expamount,maturedate} =req.body
              
                database('investmentdetails2')
                .where({
                  Email: email,
                  DateInvested: date,
                  AmountInvested: amount,
                  InvestmentPeriod :period,
                  ExpectedAmount : expamount,
                  MaturityDate:maturedate
                })
                .then(user=>{
                    const isCorrect = email === user[0].Email
                    if(isCorrect){
                  database("investmentdetails2") 
                  .where({
                    Email: email,
                    DateInvested: date,
                    AmountInvested: amount,
                    InvestmentPeriod :period,
                    ExpectedAmount : expamount,
                    MaturityDate:maturedate
                  })     
                  .update({  
                InvestmentStatus: "Approved"
               })
               .then(user =>{ 
                res.status(200).json("success")
                }) 
                .catch(err=> res.status(400).json(err))
                    }
                })
                 .catch(err=>{res.status(400).json(err)})
            })
    
    
            app.post("/edit1" ,(req,res)=>{
                const {email,amount,period,expamount} = req.body
    
                function EditaddDays(date, days) {
                    var result = new Date(date);
                    result.setDate(result.getDate() + days);
                    return result;
                  }
                  
                  
                  const EditTime =()=>{
                      let times
                      if (period === "5") {
                        times="5Days"
                      }
                      if (period === "8") {
                         times="8Days" 
                    }
                    if (period === "14") {
                          times="14Days"
                    }
                    
                    return times
                  }
    
                  
            
    
                database('investmentdetails2')
                .where('Email', email)
                .then(user=>{
                    const investdate = user[0].DateInvested
                    const isCorrect = email === user[0].Email
                    if(isCorrect){
                  database("investmentdetails2") 
                  .where("Email", "=", req.body.email)     
                  .update({  
                    AmountInvested: amount,
                    InvestmentPeriod : EditTime(),
                    ExpectedAmount : expamount,
                    MaturityDate:EditaddDays(investdate,parseInt(period))
               })
               .then(user =>{ 
                res.status(200).json("success")
                }) 
                .catch(err=> res.status(400).json(err))
                    }
                })
                 .catch(err=>{res.status(400).json(err)})
            })
    
            app.post("/delete1",(req,res)=>{
              const {email,amount,date,period,expamount,maturedate} =req.body
              database('investmentdetails2')
              .where({
                Email: email,
                DateInvested: date,
                AmountInvested: amount,
                InvestmentPeriod :period,
                ExpectedAmount : expamount,
                MaturityDate:maturedate
              })
              .del()
              .then(user =>{ 
                res.status(200).json("success")
                }) 
                .catch(err=> res.status(400).json(err))
            })
    
            app.post("/deleteuser1", (req, res) =>{
              const {email} = req.body 
              database('investmentdetails2')
             .where("Email","=", email)
             .then(user=>{
              const isCorrect = email === user[0].Email
              if(isCorrect){
          database.raw(
            "DELETE user_details2 ,investmentdetails2 FROM user_details2 INNER JOIN investmentdetails2 ON investmentdetails2.Email = user_details2.Email  WHERE user_details2.Email = ?", email)   
            .then(user =>{ 
                      res.status(200).json("user")
                      }) 
                      .catch(err=> res.status(400).json(err))  
                    
                  } 
              })
              .catch(err=> res.status(400).json("errorname"))  
          })
    

app.listen(process.env.PORT || 3003)   
