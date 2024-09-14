import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Upload from '../../components/upload/Upload';
import FooterWithDisclaimer from '../../components/footerWithDisclaimer/FooterWithDisclaimer';
import './dashboardPage.css';

const DashboardPage = () => {
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const mutation = useMutation({
    mutationFn: (text) => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text }),
      }).then((res) => res.json());
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
      navigate(`/dashboard/chats/${id}`)
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const text = formData.get('text');
    if (!text) return;
    mutation.mutate(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  return (
    <div className='dashboardPage'>
      <div className="texts">
        <div className="logo">
          <img src='/hcltechicon.png' alt='' />
          <h1>Gen AI Chatbot</h1>
        </div>
        <div className='options'>
          <div className="option">
            <img src="/chat.png" alt="" />
            <span>Create a New Chat</span>
          </div>
          <div className="option">
            <img src="/image.png" alt="" />
            <span>Analyze Images</span>
          </div>
          <div className="option">
            <img src="/code.png" alt="" />
            <span>Help me with my Code</span>
          </div>
        </div>
      </div>
      <div className="formContainer">
        <form onSubmit={handleSubmit} ref={formRef}>
          <Upload setImg={setImg} />
          <textarea
            name='text'
            placeholder='Please enter your prompt'
            onKeyDown={handleKeyDown}
          />
          <button type="submit">
            <img src="/arrow.png" alt="" />
          </button>
        </form>
        <FooterWithDisclaimer />
      </div>
    </div>
  );
}

export default DashboardPage;