const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')

exports.doesUsernameExist = function(req,res){
     User.findByUsername(req.body.username).then(function(){
        res.json(true)
     }).catch(function(){
        res.json(false)
     })
}

exports.doesEmailExist =async function(req,res){
    let emailBool = await User.doesEmailExist(req.body.email)
    res.json(emailBool)
}

exports.sharedProfileData = async function(req, res, next){
 let isVisitorsProfile = false
 let isFollowing = false
  if(req.session.user){
     isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
     isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
    }
 req.isVisitorsProfile = isVisitorsProfile
 req.isFollowing = isFollowing
// mengambil jumlah post follower dan folowing.
    let postsCountPromise = Post.countPostsByAuthor(req.profileUser._id)
    let followerCountPromise = Follow.countFollowersById(req.profileUser._id)
    let followingCountPromise = Follow.countFollowingById(req.profileUser._id)
    let [postsCount,followerCount,followingCount]= await Promise.all([postsCountPromise,followerCountPromise,followingCountPromise])

    req.postsCount = postsCount
    req.followerCount = followerCount
    req.followingCount = followingCount

 next()
} 

exports.mustBeLoggedIn = function(req,res,next){
    if(req.session.user){
        next()
    }else{
        req.flash("errors","kamu harus loggin dulu")
        req.session.save(function(){
            res.redirect('/')
        })
    }
}

exports.login = function(req,res){
 let user = new User(req.body)
  user.login().then(function(result){
   req.session.user = {avatar: user.avatar, username : user.data.username, _id : user.data._id}
     req.session.save(function(){
     res.redirect('/')
     })
  }).catch(function(error){
   req.flash('errors',error)
   req.session.save(function(){
    res.redirect('/')
   })
  })
}

exports.apiLogin = function(req,res){
    let user = new User(req.body)
     user.login().then(function(result){
        res.json("ok password benar")
     }).catch(function(error){
        res.json("password salah")
     })
   } 

exports.logout = function(req, res){
    req.session.destroy(function(){
    res.redirect('/')
    })
   
}

exports.register = function(req, res){
 let user = new User(req.body)
user.register().then(()=>{
    req.session.user = {username : user.data.username, avatar: user.avatar, _id : user.data._id}
    req.session.save(function(){
        res.redirect('/')
        })
}).catch((regErrors)=>{
    regErrors.forEach(function(error) {
        req.flash('regErrors', error)
       })
       req.session.save(function(){
       res.redirect('/')
       })
})
}

exports.home = async function(req, res){
if(req.session.user){
    // mengambil feed untuk akun 
    let posts = await Post.getFeed(req.session.user._id)
 res.render('home-dashboard', {posts: posts})
}else{
 res.render('home-guest',{regErrors: req.flash('regErrors')})
}
}

exports.ifUserExists = function(req,res,next){
   User.findByUsername(req.params.username).then(function(userDocument){
    req.profileUser = userDocument
    next()
   }).catch(function(){
    res.render("404")
   })
}

exports.profilePostScreen = function(req,res){
    //meminta post model via pemilik post id
    Post.findByAuthorId(req.profileUser._id).then(function(posts){
        res.render("profile", {
            title : `profil dari : ${req.profileUser.username}`,
            currentPage : "posts",
            posts : posts,
            profileUsername : req.profileUser.username,
            profileAvatar : req.profileUser.avatar,
            isFollowing : req.isFollowing,
            isVisitorsProfile : req.isVisitorsProfile,
            counts : { postCount: req.postsCount, followerCount: req.followerCount, followingCount: req.followingCount}
        }) 
    }).catch(function(){
        res.render("404")
    })

 }

exports.profileFollowersScreen = async function(req, res){
 let followers = await Follow.getFollowersById(req.profileUser._id)
  res.render("profile-followers",{
    currentPage : "followers",
    followers: followers,
    profileUsername : req.profileUser.username,
    profileAvatar : req.profileUser.avatar,
    isFollowing : req.isFollowing,
    isVisitorsProfile : req.isVisitorsProfile,
    counts : { postCount: req.postsCount, followerCount: req.followerCount, followingCount: req.followingCount}
 })
 }

 exports.profileFollowingScreen = async function(req, res){
    let following = await Follow.getFollowingById(req.profileUser._id)
     res.render("profile-following",{
        currentPage : "following",
       following: following,
       profileUsername : req.profileUser.username,
       profileAvatar : req.profileUser.avatar,
       isFollowing : req.isFollowing,
       isVisitorsProfile : req.isVisitorsProfile,
       counts : { postCount: req.postsCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
    }