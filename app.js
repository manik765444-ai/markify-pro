// app.js

const express = require('express');
const path = require('path');
const fs = require('fs');
const marked = require('marked');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Setup database
const posts = [];

// Load posts from file
try {
  const data = fs.readFileSync('posts.json');
  posts.push(...JSON.parse(data));
} catch (err) {}

// Save posts to file
function savePosts() {
  fs.writeFileSync('posts.json', JSON.stringify(posts));
}

// Render post with markdown
function renderPost(post) {
  const html = marked(post.content);
  return { ...post, html };
}

// Render index template
function renderIndex(posts) {
  const html = posts.map(post => `
    <h2>${post.title}</h2>
    <p>${post.date}</p>
    <a href="/${post.slug}">Read more</a>
  `).join('');
  return `
    <html>
      <body>
        <h1>My Blog</h1>
        ${html}
      </body>
    </html>
  `;
}

// Render post template
function renderPostTemplate(post) {
  return `
    <html>
      <body>
        <h1>${post.title}</h1>
        <p>${post.date}</p>
        ${post.html}
      </body>
    </html>
  `;
}

// GET /
app.get('/', (req, res) => {
  const renderedPosts = posts.map(renderPost);
  const html = renderIndex(renderedPosts);
  res.send(html);
});

// GET /post
app.get('/:slug', (req, res) => {
  const slug = req.params.slug;
  const post = posts.find(post => post.slug === slug);
  if (!post) {
    res.status(404).send('Post not found');
  } else {
    const renderedPost = renderPost(post);
    const html = renderPostTemplate(renderedPost);
    res.send(html);
  }
});

// POST /new
app.post('/new', (req, res) => {
  const title = req.body.title;
  const content = req.body.content;
  const slug = title.toLowerCase().replace(/ /g, '-');
  const post = { title, content, slug, date: new Date().toISOString() };
  posts.push(post);
  savePosts();
  res.redirect(`/${slug}`);
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).send('Page not found');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal server error');
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});