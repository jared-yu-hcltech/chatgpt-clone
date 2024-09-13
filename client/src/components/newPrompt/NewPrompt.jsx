import { useEffect, useRef, useState } from 'react';
import './newPrompt.css'
import Upload from '../upload/Upload';
import { IKImage } from 'imagekitio-react';
import geminiModel from '../../lib/gemini';
import azureOpenAIModel from '../../lib/azureopenai';
import Markdown from 'react-markdown'
import { useMutation, useQueryClient } from '@tanstack/react-query';

const NewPrompt = ({ data }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  // Gemini
  // const chat = geminiModel.startChat({
  //   history: data?.history.map(({ role, parts }) => ({
  //     role,
  //     parts: [{ text: parts[0].text }],
  //   })),
  //   generationConfig: {
  //     // maxOutputTokens: 100,
  //   },
  // });

  // Azure Open AI
  const prepareChatHistory = (history, lastUserMessage) => {
    const systemMessage = { role: "system", content: "You are a helpful assistant." };

    const mappedHistory = history.map(({ role, parts }) => ({
      role: role === "model" ? "assistant" : role,
      content: parts[0].text,
    }));

    const userMessage = lastUserMessage ? { role: "user", content: lastUserMessage } : null;

    return [systemMessage, ...mappedHistory, userMessage].filter(Boolean);
  };

  const endRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [data, question, answer, img.dbData]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.length ? question : undefined,
          answer,
          img: img.dbData?.filePath || undefined,
        }),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: ['chat', data._id] })
        .then(() => {
          formRef.current.reset();
          setQuestion('');
          setAnswer('');
          setImg({
            isLoading: false,
            error: "",
            dbData: {},
            aiData: {},
          });
        });
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const add = async (text, isInitial) => {
    if (!isInitial) setQuestion(text);

    // Azure Open AI
    try {
      // Usage in your code
      const chatHistory = prepareChatHistory(data?.history || [], text);

      const result = await azureOpenAIModel.chat.completions.create({
        messages: chatHistory,
        stream: true, // Enable streaming responses
      });

      let accumulatedText = '';
      for await (const chunk of result) {
        const chunkText = chunk.choices[0]?.delta?.content || '';
        console.log(chunkText);
        accumulatedText += chunkText;
        setAnswer(accumulatedText);
      }

      mutation.mutate(); // Save chat to the database
    } catch (err) {
      console.log(err);
    }

    // Gemini
    // try {
    //   const result = await chat.sendMessageStream(
    //     Object.entries(img.aiData).length ? [img.aiData, text] : [text]
    //   );
    //   let accumulatedText = '';
    //   for await (const chunk of result.stream) {
    //     const chunkText = chunk.text();
    //     console.log(chunkText);
    //     accumulatedText += chunkText;
    //     setAnswer(accumulatedText);
    //   }

    //   mutation.mutate();
    // } catch (err) {
    //   console.log(err)
    // }

  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const text = e.target.text.value;
    if (!text) return;

    add(text, false);
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  // IN PRODUCTION WE DON'T NEED IT
  const hasRun = useRef(false);
  useEffect(() => {
    if (!hasRun.current) {
      if (data?.history.length === 1) {
        add(data.history[0].parts[0].text, true);
      }
    }
    hasRun.current = true;
  }, []);

  return (
    <>
      {/* ADD NEW CHAT */}
      {img.isLoading && <div className=''>Loading...</div>}
      {img.dbData?.filePath && (
        <IKImage
          urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
          path={img.dbData?.filePath}
          width="380"
          transformation={[{ with: 380 }]}
        />
      )}
      {question && <div className='message user'>{question}</div>}
      {answer && (
        <div className='message bot'>
          <Markdown>{answer}</Markdown>
        </div>
      )}
      <div className="endChat" ref={endRef}></div>
      <form className='newForm' onSubmit={handleSubmit} ref={formRef}>
        <Upload setImg={setImg} />
        <input id='file' type='file' multiple={false} hidden />
        <textarea name='text' placeholder='Please enter your prompt' onKeyDown={handleKeyDown} />
        <button>
          <img src='/arrow.png' alt='' />
        </button>
      </form>
    </>
  )
}

export default NewPrompt;