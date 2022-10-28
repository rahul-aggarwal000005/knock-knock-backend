const { Client } = require("twitter-api-sdk");
const SerpApi = require("google-search-results-nodejs");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT || 3001;
const app = express();
const axios = require("axios");
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
  auth: "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",
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

// recursive method to transform nested objects
const recTxf = (parm) => {
  if (parm == null) return { null: null };
  if (Array.isArray(parm)) {
    // if key-value pair array
    const [k, v] = parm; // either recurse to nested, or return key-value pair
    if (typeof v === "object") return recTxf(v);
    else return { [k]: v };
  } else
    return {
      // otherwise, it is object
      ...Object.entries(parm) // iterate over key-value pairs
        .reduce(
          (acc, itm) => ({
            // use "reduce" to accumulate/aggregate
            ...acc,
            ...recTxf(itm), // aggregate results of the recursive calls
          }),
          {}
        ),
    };
};

const logo_obj = {
  google: "https://i.postimg.cc/PqGdTFxb/google.png",
  github: "https://i.postimg.cc/0yCq15Tv/github.png",
  stackoverflow: "https://i.postimg.cc/rwMvjXKP/stackoverflow.png",
  twitter: "https://i.postimg.cc/RZkc79Pk/twitter.png",
  youtube: "https://i.postimg.cc/7PtJ1whK/youtube.png",
};
// get the google results
app.get("/api/google*", (req, res) => {
  const search = new SerpApi.GoogleSearch(
    "403a31dba1c19517d8dff9448a32628fd302484d06eb60393f2538df0b089f53"
  );
  const params = {
    device: "desktop",
    engine: "google",
    q: req.query.q ? req.query.q : "coffee",
    google_domain: "google.com",
    gl: "us",
    hl: "en",
  };

  const formatData = (data) => {
    const results = data.organic_results;
    let formattedData = [];
    results.forEach((obj) => {
      formattedData.push({
        info: recTxf(obj),
        img: obj.thumbnail
          ? obj.thumbnail
          : "https://i.postimg.cc/1X816L5j/google.png",
        link: obj.link,
        title: obj.title,
        logo: logo_obj.google,
      });
    });
    return formattedData;
  };

  const callback = function (data) {
    const results = formatData(data);
    res.json({ results });
  };
  search.json(params, callback);
});

// get the youtube results
app.get("/api/youtube*", (req, res) => {
  const params = {
    engine: "youtube",
    search_query: req.query.q || "doraemon",
    api_key: "403a31dba1c19517d8dff9448a32628fd302484d06eb60393f2538df0b089f53",
  };

  const formatData = (data) => {
    const videoData = data.video_results;
    let formattedData = [];
    videoData.forEach((obj) => {
      formattedData.push({
        info: recTxf(obj),
        img: obj.thumbnail.static,
        link: obj.link,
        logo: logo_obj.youtube,
      });
    });
    return formattedData;
  };

  const search = new SerpApi.GoogleSearch(params);
  const callback = function (data) {
    const results = formatData(data);
    res.json({ results });
  };
  search.json(params, callback);
});

// get the stackoverflow results
app.get("/api/stackoverflow*", (req, res) => {
  const query = req.query.q;
  const formatData = (data) => {
    const result = data.items;
    let formattedData = [];
    result.forEach((obj) => {
      formattedData.push({
        info: recTxf(obj),
        title: obj.title,
        link: obj.link,
        logo: logo_obj.stackoverflow,
        img: "https://firebasestorage.googleapis.com/v0/b/practice-fireb-f04a6.appspot.com/o/data%2Fstackoverflow.png?alt=media&token=ab44b99f-71d7-45e4-b454-b536079003bc",
      });
    });
    return formattedData;
  };
  axios
    .get(
      `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=activity&q=${query}&site=stackoverflow`
    )
    .then((data) => {
      let tempData = JSON.parse(JSON.stringify(data.data));
      const results = formatData(tempData);
      res.json({ results });
    });
});

// github results
app.get("/api/github*", async (req, res) => {
  try {
    const result = await octokit.request("GET /search/repositories", {
      q: req.query.q ? req.query.q : "css",
    });

    const formatData = (data) => {
      const result = data.data.items;
      let formattedData = [];
      result.forEach((obj) => {
        formattedData.push({
          info: recTxf(obj),
          title: "",
          link: obj.html_url,
          img: obj.owner.avatar_url,
          logo: logo_obj.github,
        });
      });
      return formattedData;
    };

    const results = formatData(result);
    res.json({ results });
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

// get the twitter results
app.get("/api/twitter*", async (req, res) => {
  const client = new Client(process.env.TWITTER_BEARER_TOKEN);
  const response = await client.tweets.tweetsRecentSearch({
    query: req.query.q ? req.query.q : "github",
  });
  const formatData = (data) => {
    let formattedData = [];
    data.forEach((obj) => {
      formattedData.push({
        info: recTxf(obj),
        title: obj.text,
        logo: logo_obj.twitter,
        link: `https://twitter.com/i/web/status/${obj.id}`,
        img: "https://i.postimg.cc/9Q9cMrg5/twitter.png",
      });
    });
    return formattedData;
  };

  const results = formatData(response.data);
  res.json({ results });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
