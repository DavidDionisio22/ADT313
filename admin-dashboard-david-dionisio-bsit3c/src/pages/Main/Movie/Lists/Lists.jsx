import { useNavigate } from 'react-router-dom';
import './Lists.css';
import { useEffect, useState } from 'react';
import axios from 'axios';

const Lists = () => {
  const accessToken = localStorage.getItem('accessToken');
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);

  const getMovies = async () => {
    try {
      const response = await axios.get('/movies');
      setLists(response.data);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    }
  };

  useEffect(() => {
    getMovies();
  }, []);

  const handleDelete = async (id) => {
    const isConfirm = window.confirm(
      'Are you sure that you want to delete this movie?'
    );
    if (isConfirm) {
      try {
        await axios.delete(`/movies/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        // Update the list locally
        setLists((prevLists) => prevLists.filter((movie) => movie.id !== id));
      } catch (error) {
        console.error('Failed to delete movie:', error);
      }
    }
  };

  return (
    <div className="lists-container">
      <div className="header">
        <h1>Movie List</h1>
        <button
          className="btn-create"
          onClick={() => navigate('/main/movies/form')}
        >
          + Add New Movie
        </button>
      </div>
      <div className="table-container">
        {lists.length > 0 ? (
          <table className="movie-lists">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((movie) => (
                <tr key={movie.id}>
                  <td>{movie.id}</td>
                  <td>{movie.title}</td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => navigate('/main/movies/form/' + movie.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(movie.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-list">No movies found. Add your first movie!</div>
        )}
      </div>
    </div>
  );
};

export default Lists;
