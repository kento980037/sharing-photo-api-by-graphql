const { ApolloServer } = require("apollo-server-express");
const express = require('express')
const expressPlayground = require('graphql-playground-middleware-express').default
const { GraphQLScalarType } = require("graphql");

const typeDefs = `
  scalar DateTime

  enum PhotoCategory {
    SELECT
    PORTRAIT
    ACTION
    LANDSCAPE
    GRAPHIC
  }

  type User {
    githubLogin: ID!
    name: String
    avatar: String
    postedPhotos: [Photo!]!
    inPhotos: [Photo!]!
  }

  type Photo {
    id: ID!
    url: String!
    name: String!
    description: String
    category: PhotoCategory!
    postedBy: User!
    taggedUsers: [User!]!
    created: DateTime!
  }

  input PostPhotoInput {
    name: String!
    category: PhotoCategory=PORTRAIT
  }

  type Query {
    totalPhotos: Int!
    allPhotos(after: DateTime): [Photo!]!
  }

  type Mutation {
    postPhoto(input: PostPhotoInput!): Photo!
  }
`;

let _id = 0
let users = [
    {
      githubLogin: "mHattrup",
      name: "Mike Hattrup",
    },
    {
      githubLogin: "gPlake",
      name: "Glen Plake",
    },
    {
      githubLogin: "sSchmidt",
      name: "Scot Schmidt",
    },
  ]
let photos = [
    {
      id: 1,
      name: "Dropping the Heart Chute",
      description: "The heart chute is one of my favorite chutes",
      category: "ACTION",
      githubUser: "gPlake",
      created: "3-28-1977",
    },
    {
      id: 2,
      name: "Enjoying the sunshine",
      category: "SELFIE",
      githubUser: "sSchmidt",
      created: "1-2-1985",
    },
    {
      id: 3,
      name: "Gunbarrel 25",
      description: "25 laps on gunbarrel today",
      category: "LANDSCAPE",
      githubUser: "sSchmidt",
      created: "2018-04-15T19:09:57.308Z",
    },
  ]
  let tags = [
    {
        "photoID": 1, 
        "userID": "gPlake",
    },
    {
        "photoID": 2, 
        "userID": "sSchmidt",
    },
    {
        "photoID": 2, 
        "userID": "mHattrup",
    },
    {
        "photoID": 2, 
        "userID": "gPlake",
    },
  ]

const resolvers = {
  Query: {
    totalPhotos: () => photos.length,
    allPhotos: (parent, args) => {
        if(!args.after) return photos
        return photos.filter((p) => new Date(p.created) > args.after);
      },
  },

  Mutation: {
    postPhoto(parent, args){
        let newPhoto = {
            id: _id++,
            githubUser: args.input.name,
            created: new Date(),
            ...args.input
        }
        photos.push(newPhoto)
        return newPhoto
    }
  },

  Photo: {
    url: parent => `http://yoursite.com/img/${parent.id}.jpg`,
    postedBy: parent => {
        return users.find(u => u.githubLogin === parent.githubUser)
    },
    taggedUsers: parent => tags.filter(tag => tag.photoID === parent.id).map(tag => tag.userID).map(userID => users.find(u => u.githubLogin === userID))
  },

  User: {
    postedPhotos: parent => {
        return photos.filter(p => p.githubLogin === parent.githubLogin)
    },
    inPhotos: parent => tags.filter(tag => tag.userID === parent.id).map(tag => tag.photoID).map(photoID => photos.find(p => p.id === photoID))
  },

  DateTime: new GraphQLScalarType({
    name: `DateTime`,
    description: `A Valid date time Value`,
    parseValue: value => new Date(value),
    serialize: value => new Date(value).toISOString(),
    parseLiteral: ast => ast.value,
  })
};

const app = express();

async function startServer() {
    apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({ app });
  }
  startServer();


app.get('/', (req, res)=>{
    res.end('Welcome to the PhotoShare API')
})
app.get('/playground',expressPlayground(
    {endpoint: `/graphql`}
))

app.listen({port:4000},()=>console.log(`GraphQL Server running @ http:localhost:4000${apolloServer.graphqlPath}`))

