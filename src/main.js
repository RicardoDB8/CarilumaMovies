// API Setup
const api = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
  params: {
    'api_key': API_KEY,
  },
});

function likedMoviesList() {
  const item = JSON.parse(localStorage.getItem('liked_movies'));
  return item ? item : {};
}

function likeMovie(movie) {
  const likedMovies = likedMoviesList();
  if (likedMovies[movie.id]) {
    delete likedMovies[movie.id];
  } else {
    likedMovies[movie.id] = movie;
  }
  localStorage.setItem('liked_movies', JSON.stringify(likedMovies));
}

const lazyLoader = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const url = entry.target.getAttribute('data-img');
      entry.target.setAttribute('src', url);
    }
  });
});

function createMovies(movies, container, { lazyLoad = false, clean = true } = {}) {
  if (clean) container.innerHTML = '';
  movies.forEach(movie => {
    const movieContainer = document.createElement('div');
    movieContainer.classList.add('movie-container');

    const movieImg = document.createElement('img');
    movieImg.classList.add('movie-img');
    movieImg.setAttribute('alt', movie.title);
    movieImg.setAttribute(
      lazyLoad ? 'data-img' : 'src',
      'https://image.tmdb.org/t/p/w300' + movie.poster_path,
    );
    movieImg.addEventListener('click', () => {
      location.hash = '#movie=' + movie.id;
    });
    movieImg.addEventListener('error', () => {
      movieImg.setAttribute('src', 'https://static.platzi.com/static/images/error/img404.png');
    });

    const movieBtn = document.createElement('button');
    movieBtn.classList.add('movie-btn');
    likedMoviesList()[movie.id] && movieBtn.classList.add('movie-btn--liked');
    movieBtn.addEventListener('click', () => {
      movieBtn.classList.toggle('movie-btn--liked');
      likeMovie(movie);
    });

    if (lazyLoad) lazyLoader.observe(movieImg);

    movieContainer.appendChild(movieImg);
    movieContainer.appendChild(movieBtn);
    container.appendChild(movieContainer);
  });
}

function createCategories(categories, container) {
  container.innerHTML = '';
  categories.forEach(category => {
    const categoryContainer = document.createElement('div');
    categoryContainer.classList.add('category-container');

    const categoryTitle = document.createElement('h3');
    categoryTitle.classList.add('category-title');
    categoryTitle.setAttribute('id', 'id' + category.id);
    categoryTitle.textContent = category.name;
    categoryTitle.addEventListener('click', () => {
      location.hash = `#category=${category.id}-${category.name}`;
    });

    categoryContainer.appendChild(categoryTitle);
    container.appendChild(categoryContainer);
  });
}

// Todas las funciones globales para navegación
window.getTrendingMoviesPreview = async function () {
  const { data } = await api('trending/movie/day');
  createMovies(data.results, trendingMoviesPreviewList, { lazyLoad: true });
};

window.getCategegoriesPreview = async function () {
  const { data } = await api('genre/movie/list');
  createCategories(data.genres, categoriesPreviewList);
};

window.getLikedMovies = function () {
  const liked = Object.values(likedMoviesList());
  createMovies(liked, likedMoviesListArticle, { lazyLoad: true });
};

window.getMoviesByCategory = async function (id) {
  const { data } = await api('discover/movie', { params: { with_genres: id } });
  maxPage = data.total_pages;
  createMovies(data.results, genericSection, { lazyLoad: true });
};

window.getPaginatedMoviesByCategory = function (id) {
  return async function () {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 15 && page < maxPage) {
      page++;
      const { data } = await api('discover/movie', { params: { with_genres: id, page } });
      createMovies(data.results, genericSection, { lazyLoad: true, clean: false });
    }
  };
};

window.getMoviesBySearch = async function (query) {
  const { data } = await api('search/movie', { params: { query } });
  maxPage = data.total_pages;
  createMovies(data.results, genericSection);
};

window.getPaginatedMoviesBySearch = function (query) {
  return async function () {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 15 && page < maxPage) {
      page++;
      const { data } = await api('search/movie', { params: { query, page } });
      createMovies(data.results, genericSection, { lazyLoad: true, clean: false });
    }
  };
};

window.getTrendingMovies = async function () {
  const { data } = await api('trending/movie/day');
  maxPage = data.total_pages;
  createMovies(data.results, genericSection, { lazyLoad: true });
};

window.getPaginatedTrendingMovies = async function () {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 15 && page < maxPage) {
    page++;
    const { data } = await api('trending/movie/day', { params: { page } });
    createMovies(data.results, genericSection, { lazyLoad: true, clean: false });
  }
};

window.getMovieById = async function (id) {
  const { data: movie } = await api('movie/' + id);
  const movieImgUrl = 'https://image.tmdb.org/t/p/w500' + movie.poster_path;

  headerSection.style.background = `
    linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.35) 19.27%,
      rgba(0, 0, 0, 0) 29.17%
    ),
    url(${movieImgUrl})
  `;

  movieDetailTitle.textContent = movie.title;
  movieDetailDescription.textContent = movie.overview;
  movieDetailScore.textContent = movie.vote_average;

  createCategories(movie.genres, movieDetailCategoriesList);
  window.getRelatedMoviesId(id);
};

window.getRelatedMoviesId = async function (id) {
  const { data } = await api(`movie/${id}/recommendations`);
  createMovies(data.results, relatedMoviesContainer);
};
