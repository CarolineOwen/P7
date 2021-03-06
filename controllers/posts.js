const Post = require('../models/Post');
const User = require('../models/User');
const fs = require("fs");

//fonction creer un post
exports.createPost = (req, res, next) => {
    const postObject = JSON.parse(req.body.post);
    delete postObject._id;
    delete postObject._userId;
    const post = new Post({
      ...postObject,
      
      userId: req.auth.userId,
      //generer l'url de l'image
      if (imageUrl){
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`},
    });
    post
      .save()//enregistrer le fichier dans la base de données
      .then(() => {
        res.status(201).json({ message: "Post enregistré !" });
      })
      .catch((error) => {
        res.status(400).json({ error });
      });
};
  
  //fonction modifier un post
  exports.modifyPost = (req, res, next) => {
    if(req.file){
        Post.findOne({ _id: req.params.id })
        .then((objet)=> {
            const filename= objet.imageUrl.split('/images')[1];
            fs.unlink(`images/${filename}`, (error) =>{
                if(error) throw error;
            })
        })
        .catch((error) => res.status(404).json({ error }));
    }else{console.log("FALSE")}
    
    const postObject = req.file
      ? {
          ...JSON.parse(req.body.post),
          imageUrl: `${req.protocol}://${req.get("host")}/images/${
            req.file.filename
          }`,
        }
      : { ...req.body };
    Post.updateOne(
      { _id: req.params.id },
      { ...postObject, _id: req.params.id }
    )
      .then(() => res.status(200).json({ message: "Objet modifié" }))
      .catch((error) => res.status(401).json({ error }));
  };
  
  //fonction supprimer un post
  exports.deletePost = (req, res, next) => {
    //recupérer l'objet en base
    Post.findOne({ _id: req.params.id })
      .then((post) => {
        //vérifier que c'est bien le userId qui veut supprimer l'image
        if (post.userId != req.auth.userId) {
          res.status(401).json({ message: "Non-autorisé" });
        } else {
          //recuperer le nom de fichier
          const filename = post.imageUrl.split("/images")[1];
          //unlink permet de supprimer le fichier
          fs.unlink(`images/${filename}`, () => {
            //supprimer le fichier dans la base de données
            Post.deleteOne({ _id: req.params.id })
              .then(() => {
                res.status(200).json({ message: "objet supprimé" });
              })
              .catch((error) => res.status(401).json({ error }));
          });
        }
      })
      .catch((error) => res.status(500).json({ error }));
  };
  
  //fonction obtenir un post
  exports.getOnePost = (req, res, next) => {
    //recupérer l'objet en base
    Post.findOne({ _id: req.params.id })
      .then((post) => res.status(200).json(post))
      .catch((error) => res.status(404).json({ error }));
  };
  
  //fonction obtenir toutes les posts
  exports.getAllPosts = (req, res, next) => {
    Post.find()
      .then((posts) => res.status(200).json(posts))
      .catch((error) => res.status(400).json({ error }));
  };
  
  //fonction pour aimer ou pas aimer les posts
  exports.likesAndDislikes = (req, res, next) => {
    Post.findOne({ _id: req.params.id })
      .then((post) => {
        //like = 1
        //si le tableau est vide et que la requete on like alors on ajoute 1
        if (!post.usersLiked.includes(req.body.userId) && req.body.like === 1) {
          Post.updateOne(
            { _id: req.params.id },
            {
              $inc: { likes: 1 },
              $push: { usersLiked: req.body.userId },
            }
          )
            .then(() => res.status(201).json({ message: "like +1" }))
            .catch((error) => res.status(404).json({ error }));
        }
        //like = 0
        if (post.usersLiked.includes(req.body.userId) && req.body.like === 0) {
          Post.updateOne(
            { _id: req.params.id },
            {
              $inc: { likes: -1 },
              $pull: { usersLiked: req.body.userId },
            }
          )
            .then(() => res.status(201).json({ message: "like 0" }))
            .catch((error) => res.status(404).json({ error }));
        }
        //like = -1
        if (
          !post.usersDisliked.includes(req.body.userId) &&
          req.body.like === -1
        ) {
          Post.updateOne(
            { _id: req.params.id },
            {
              $inc: { dislikes: 1 },
              $push: { usersDisliked: req.body.userId },
            }
          )
            .then(() => res.status(201).json({ message: "dislike 1" }))
            .catch((error) => res.status(404).json({ error }));
        }
        //like = 0 après un like -1(enlever le dislike)
        if (
          post.usersDisliked.includes(req.body.userId) &&
          req.body.like === 0
        ) {
          Post.updateOne(
            { _id: req.params.id },
            {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: req.body.userId },
            }
          )
            .then(() => res.status(201).json({ message: "dislike 0" }))
            .catch((error) => res.status(404).json({ error }));
        }
      })
      .catch((error) => res.status(404).json({ error }));
  };