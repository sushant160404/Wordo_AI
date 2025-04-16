import React, { useState } from 'react';
import { ChatGroq } from '@langchain/groq';

const RealTimeTranslation = () => {
  const [languageFrom, setLanguageFrom] = useState('english');
  const [languageTo, setLanguageTo] = useState('french');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');

  // Initialize ChatGroq with the correct method
  const groq = new ChatGroq({
    apiKey: "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", // Use environment variable
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
  });

  const languages = [
    { id: 'english', name: 'English', code: 'en-US' },
    { id: 'french', name: 'French', code: 'fr-FR' },
    { id: 'spanish', name: 'Spanish', code: 'es-ES' },
    { id: 'german', name: 'German', code: 'de-DE' },
    { id: 'hindi', name: 'Hindi', code: 'hi-IN' },
  ];

  const translateText = async () => {
    try {
      const response = await groq.call([
        { role: "system", content: `Translate the following text from ${languageFrom} to ${languageTo}. dont show any text other than the translation` },
        { role: "user", content: inputText },
      ]);

      if (response && response.content) {
        setTranslatedText(response.content.trim());
      } else {
        setTranslatedText("Translation failed. No response from API.");
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText("Error in translation. Please check console for details.");
    }
  };

  return (
    <div className="relative flex flex-col ml-60 min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h1 className="text-2xl font-bold text-center mb-4 text-black">Real-Time Translation</h1>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <select value={languageFrom} onChange={(e) => setLanguageFrom(e.target.value)} className="p-2 border rounded text-black">
            {languages.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
          </select>
          <select value={languageTo} onChange={(e) => setLanguageTo(e.target.value)} className="p-2 border rounded text-black">
            {languages.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
          </select>
        </div>
        <textarea 
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)} 
          placeholder="Type text to translate..." 
          className="w-full p-2 border rounded mb-4 text-black"
        />
        <button onClick={translateText} className="py-2 px-4 bg-indigo-500 text-white rounded-lg w-full mb-4">
          Translate
        </button>
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-medium text-black">Translated Text:</h2>
          <p className="mt-2 text-black">{translatedText || 'Translation will appear here...'}</p>
        </div>
      </div>
    </div>
  );
};

export default RealTimeTranslation;