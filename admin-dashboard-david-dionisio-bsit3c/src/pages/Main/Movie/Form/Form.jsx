import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Form.css";

const MovieEditor = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchedMovies, setFetchedMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [movieInput, setMovieInput] = useState({
    title: "",
    description: "",
    popularity: "",
    releaseDate: "",
    rating: "",
  });
  const [errorText, setErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { movieId } = useParams();
  const navigate = useNavigate();

  const fetchMovies = useCallback(() => {
    setErrorText("");
    if (!searchQuery) {
      setErrorText("Please provide a search term.");
      return;
    }

    setIsLoading(true);
    setFetchedMovies([]);

    axios({
      method: "get",
      url: `https://api.themoviedb.org/3/search/movie?query=${searchQuery}&include_adult=false&language=en-US&page=${currentPage}`,
      headers: {
        Accept: "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5YTdiNmUyNGJkNWRkNjhiNmE1ZWFjZjgyNWY3NGY5ZCIsIm5iZiI6MTcyOTI5NzI5Ny4wNzMzNTEsInN1YiI6IjY2MzhlZGM0MmZhZjRkMDEzMGM2NzM3NyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ZIX4EF2yAKl6NwhcmhZucxSQi1rJDZiGG80tDd6_9XI",
      },
    })
      .then((response) => {
        if (response.data.results.length === 0) {
          setErrorText("No movies found matching your search criteria.");
        } else {
          setFetchedMovies(response.data.results);
          setTotalPages(response.data.total_pages);
        }
      })
      .catch(() => {
        setErrorText("Failed to fetch movies. Try again later.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchQuery, currentPage]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchMovies();
    }
  }, [currentPage, fetchMovies]);

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setMovieInput({
      title: movie.original_title,
      description: movie.overview,
      popularity: movie.popularity,
      releaseDate: movie.release_date,
      rating: movie.vote_average,
    });
    setErrorText("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMovieInput((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorText("");
  };

  const handleSearchEnterPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setCurrentPage(1);
      fetchMovies();
    }
  };

  const validateForm = () => {
    const validationErrors = [];
    if (!movieInput.title) validationErrors.push("Title is required");
    if (!movieInput.description) validationErrors.push("Description is required");
    if (!movieInput.releaseDate) validationErrors.push("Release date is required");
    if (!movieInput.popularity) validationErrors.push("Popularity is required");
    if (!movieInput.rating) validationErrors.push("Rating is required");
    if (!selectedMovie) validationErrors.push("Please select a movie.");
    return validationErrors;
  };

  const saveMovie = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setErrorText(errors.join(", "));
      return;
    }

    setIsLoading(true);
    setErrorText("");

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setErrorText("You must be logged in.");
      setIsLoading(false);
      return;
    }

    const moviePayload = {
      tmdbId: selectedMovie.id,
      title: movieInput.title,
      description: movieInput.description,
      popularity: parseFloat(movieInput.popularity),
      releaseDate: movieInput.releaseDate,
      rating: parseFloat(movieInput.rating),
      backdropPath: `https://image.tmdb.org/t/p/original/${selectedMovie.backdrop_path}`,
      posterPath: `https://image.tmdb.org/t/p/original/${selectedMovie.poster_path}`,
      isFeatured: 0,
    };

    try {
      console.log("Movie Payload:", moviePayload); // Log the payload to check

      const response = await axios({
        method: movieId ? "patch" : "post",
        url: movieId ? `/movies/${movieId}` : "/movies",
        data: moviePayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("Response:", response); // Log the response for debugging
      navigate("/main/movies");
    } catch (error) {
      console.error("Error Response:", error.response); // Log full error response for debugging

      const errorMessage =
        error.response?.data?.message ||
        "Failed to save movie. Please try again.";

      setErrorText(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const editMovie = saveMovie;

  useEffect(() => {
    if (movieId) {
      setIsLoading(true);
      setErrorText("");

      axios
        .get(`/movies/${movieId}`)
        .then((response) => {
          setMovieDetails(response.data);
          const updatedInputData = {
            id: response.data.tmdbId,
            original_title: response.data.title,
            description: response.data.overview,
            popularity: response.data.popularity,
            poster_path: response.data.posterPath.replace("https://image.tmdb.org/t/p/original/", ""),
            release_date: response.data.releaseDate,
            rating: response.data.voteAverage,
          };
          setSelectedMovie(updatedInputData);
          setMovieInput({
            title: response.data.title,
            description: response.data.overview,
            popularity: response.data.popularity,
            releaseDate: response.data.releaseDate,
            rating: response.data.voteAverage,
          });
        })
        .catch(() => {
          setErrorText("Unable to fetch movie details.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [movieId]);

  return (
    <>
      <h1>{movieId !== undefined ? "Update" : "Add"} Movie</h1>

      {errorText && <div className="error-message">{errorText}</div>}
      {isLoading && <div className="loading-message">Please wait...</div>}

      {movieId === undefined && (
        <>
          <div className="search-section">
            Search Movie:{" "}
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setErrorText("");
              }}
              onKeyPress={handleSearchEnterPress}
              placeholder="Search by title..."
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => {
                setCurrentPage(1);
                fetchMovies();
              }}
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
            <div className="search-results">
              {fetchedMovies.map((movie) => (
                <p
                  key={movie.id}
                  onClick={() => handleMovieSelect(movie)}
                  className={selectedMovie?.id === movie.id ? "selected" : ""}
                >
                  {movie.original_title}
                </p>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                </button>
              </div>
            )}
          </div>
          <hr />
        </>
      )}

      <div className="form-container">
        <form onSubmit={(e) => e.preventDefault()}>
          {selectedMovie && (
            <img
              className="movie-poster"
              src={`https://image.tmdb.org/t/p/original/${selectedMovie.poster_path}`}
              alt={selectedMovie.original_title}
              style={{ width: "100px" }}
            />
          )}
          <div className="form-group">
            <label htmlFor="movieTitle">Title</label>
            <input
              type="text"
              id="movieTitle"
              name="title"
              value={movieInput.title}
              onChange={handleInputChange}
              placeholder="Movie Title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="movieDescription">Description</label>
            <textarea
              id="movieDescription"
              name="description"
              value={movieInput.description}
              onChange={handleInputChange}
              placeholder="Movie Description"
            />
          </div>
          <div className="form-group">
            <label htmlFor="moviePopularity">Popularity</label>
            <input
              type="number"
              id="moviePopularity"
              name="popularity"
              value={movieInput.popularity}
              onChange={handleInputChange}
              placeholder="Popularity"
            />
          </div>
          <div className="form-group">
            <label htmlFor="movieReleaseDate">Release Date</label>
            <input
              type="date"
              id="movieReleaseDate"
              name="releaseDate"
              value={movieInput.releaseDate}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="movieRating">Rating</label>
            <input
              type="number"
              id="movieRating"
              name="rating"
              value={movieInput.rating}
              onChange={handleInputChange}
              placeholder="Rating"
            />
          </div>
          <div className="form-group">
            <button
              type="button"
              onClick={editMovie}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : movieId ? "Update Movie" : "Save Movie"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default MovieEditor;
