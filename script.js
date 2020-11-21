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
        host : "sql2.freemysqlhosting.net",
        user : "sql2377541",
        password : "rK2*bP6*",
        database : "sql2377541",
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

              const Newmoney =() =>{
                let cash
                if (period === "30") {
                 cash=((0.1* parseFloat(amount))+  parseFloat(amount))
               }
               if (period === "60") {
                 cash=((0.3* parseInt(amount))+ parseInt(amount))
               }
               if (period === "180") {
                 cash=((0.5*parseFloat(amount))+  parseFloat(amount))
               }
               if (period === "365") {
                 cash=((1.5*parseFloat(amount))+  parseFloat(amount))
               }
               return cash
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
                ExpectedAmount : Newmoney(),
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

app.listen(process.env.PORT || 3003)   