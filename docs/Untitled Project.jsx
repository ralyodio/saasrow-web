function SubmitForm() {
  const [fileUrl, setFileUrl] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 1, name: 'Zoom.jpg', size: '500kb', icon: '📹' }
  ])

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      <nav className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-[2px]">
            <div className="w-6 h-[2px] bg-[#98ff98]"></div>
            <div className="w-4 h-[2px] bg-[#98ff98]"></div>
            <div className="w-5 h-[2px] bg-[#98ff98]"></div>
          </div>
          <span className="text-2xl font-semibold">SaaS<span className="text-[#98ff98]">Row</span></span>
        </div>
        
        <div className="flex items-center gap-8">
          <a href="#" className="hover:text-[#98ff98]">Apps</a>
          <a href="#" className="hover:text-[#98ff98]">Tags</a>
          <a href="#" className="hover:text-[#98ff98]">Community</a>
          <a href="#" className="hover:text-[#98ff98]">Get Featured</a>
          <button className="bg-gradient-to-r from-[#98ff98] to-[#00ff00] px-6 py-2 rounded-full text-black">
            Sign in
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto bg-[#2a2a2a] rounded-xl p-8">
        <p className="mb-8">
          <span className="text-[#98ff98]">Please</span> note that all submitted <span className="text-[#98ff98]">products</span> go through an <span className="text-[#98ff98]">approval process</span>
        </p>

        <div className="space-y-6">
          <div>
            <label className="block mb-2">Title</label>
            <input 
              type="text"
              placeholder="Enter your Title"
              className="w-full bg-[#3a3a3a] rounded-lg p-3 outline-none"
            />
          </div>

          <div>
            <label className="block mb-2">URL</label>
            <input 
              type="text"
              placeholder="Enter your URL"
              className="w-full bg-[#3a3a3a] rounded-lg p-3 outline-none"
            />
          </div>

          <div>
            <label className="block mb-2">Description</label>
            <textarea
              placeholder="Enter your Description"
              className="w-full bg-[#3a3a3a] rounded-lg p-3 h-32 outline-none resize-none"
            />
          </div>

          <div className="border-2 border-dashed border-[#98ff98] rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-[#98ff98] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="mb-2">Drag your file(s) or <span className="text-[#98ff98]">browse</span></p>
            <p className="text-sm text-gray-400">Max 10 MB files are allowed</p>
          </div>

          <p className="text-sm text-gray-400">Only support .jpg, .png and .svg</p>

          <div className="text-center text-gray-400 my-4">OR</div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add file URL"
              className="flex-1 bg-[#3a3a3a] rounded-lg p-3 outline-none"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
            <button className="bg-gradient-to-r from-[#98ff98] to-[#00ff00] px-6 rounded-lg text-black">
              Upload
            </button>
          </div>

          {uploadedFiles.map(file => (
            <div key={file.id} className="flex items-center justify-between bg-[#3a3a3a] rounded-lg p-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{file.icon}</span>
                <div>
                  <p>{file.name}</p>
                  <p className="text-sm text-gray-400">{file.size}</p>
                </div>
              </div>
              <button className="text-[#98ff98]">×</button>
            </div>
          ))}

          <button className="w-full bg-gradient-to-r from-[#98ff98] to-[#00ff00] py-3 rounded-full text-black mt-6">
            Submit
          </button>
        </div>
      </div>

      <footer className="mt-20 flex justify-between items-center text-gray-400 text-sm">
        <div className="flex gap-8">
          <a href="#" className="hover:text-white">About us</a>
          <a href="#" className="hover:text-white">Discover</a>
          <a href="#" className="hover:text-white">Explore</a>
          <a href="#" className="hover:text-white">News</a>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white">Facebook</a>
          <a href="#" className="hover:text-white">Twitter</a>
          <a href="#" className="hover:text-white">Vimeo</a>
          <a href="#" className="hover:text-white">YouTube</a>
        </div>
      </footer>
    </div>
  )
}

function FormNotice() {
  return (
    <div className="text-[16px]/[24px] text-white mb-6">
      <span className="text-[#98ff98]">Please</span> note that all submitted <span className="text-[#98ff98]">products</span> go through an <span className="text-[#98ff98]">approval process</span>
    </div>
  );
}

function FileUploadForm() {
  const [files, setFiles] = useState([]);
  const [fileUrl, setFileUrl] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles([...files, { name: file.name, size: `${Math.round(file.size / 1000)}kb` }]);
    }
  };

  return (
    <div className="w-full max-w-[800px] bg-[#2A2A2A] rounded-[12px] p-8">
      <FormNotice />
      
      <div className="space-y-4">
        <div>
          <label className="block text-white mb-2">Title</label>
          <input 
            type="text"
            placeholder="Enter your Title"
            className="w-full bg-[#3A3A3A] rounded-lg p-3 text-white placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-white mb-2">URL</label>
          <input 
            type="text"
            placeholder="Enter your URL"
            className="w-full bg-[#3A3A3A] rounded-lg p-3 text-white placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-white mb-2">Description</label>
          <textarea 
            placeholder="Enter your Description"
            className="w-full bg-[#3A3A3A] rounded-lg p-3 text-white placeholder-gray-400 h-[120px]"
          />
        </div>

        <div className="border-[1px] border-dashed border-[#98ff98] rounded-lg p-8 text-center">
          <div className="text-[#98ff98] mb-2">
            <svg className="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
            </svg>
          </div>
          <div className="text-white">
            Drag your file(s) or <span className="text-[#98ff98]">browse</span>
          </div>
          <div className="text-gray-400 text-sm mt-1">
            Max 10 MB files are allowed
          </div>
        </div>

        <div className="text-gray-400 text-sm">
          Only support .jpg, .png and .svg
        </div>

        <div className="text-center text-gray-400 my-4">OR</div>

        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="Add file URL"
            className="flex-1 bg-[#3A3A3A] rounded-lg p-3 text-white placeholder-gray-400"
          />
          <button className="bg-gradient-to-r from-[#98ff98] to-[#00ff00] text-black px-6 rounded-lg">
            Upload
          </button>
        </div>

        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between bg-[#3A3A3A] rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 rounded p-2">
                <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 18h12V6h-4V2H4v16zm2-6h8v2H6v-2zm0-3h8v2H6V9zm0-3h4v2H6V6z"/>
                </svg>
              </div>
              <div>
                <div className="text-white">{file.name}</div>
                <div className="text-gray-400 text-sm">{file.size}</div>
              </div>
            </div>
            <button className="text-[#98ff98]">×</button>
          </div>
        ))}

        <button className="w-full bg-gradient-to-r from-[#98ff98] to-[#00ff00] text-black py-3 rounded-full mt-6">
          Submit
        </button>
      </div>
    </div>
  );
}

function FormFields() {
  const [files, setFiles] = useState([]);
  const [fileUrl, setFileUrl] = useState('');

  const handleDrop = useCallback((acceptedFiles) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-[800px] bg-[#2A2A2A] rounded-[12px] p-[32px]">
      <p className="text-[16px] mb-[24px]">
        <span className="text-[#98FF98]">Please</span> note that all submitted <span className="text-[#98FF98]">products</span> go through an <span className="text-[#98FF98]">approval process</span>
      </p>

      <div className="space-y-[16px]">
        <div>
          <label className="block text-white mb-[8px]">Title</label>
          <input
            type="text"
            placeholder="Enter your Title"
            className="w-full bg-[#3A3A3A] rounded-[8px] p-[12px] text-white placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-white mb-[8px]">URL</label>
          <input
            type="url"
            placeholder="Enter your URL"
            className="w-full bg-[#3A3A3A] rounded-[8px] p-[12px] text-white placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-white mb-[8px]">Description</label>
          <textarea
            placeholder="Enter your Description"
            className="w-full bg-[#3A3A3A] rounded-[8px] p-[12px] text-white placeholder-gray-400 min-h-[120px]"
          />
        </div>

        <div className="mt-[24px]">
          <div className="border-[1px] border-dashed border-[#98FF98] rounded-[8px] p-[32px] text-center">
            <div className="text-[#98FF98] mb-[8px]">
              <svg className="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
              <span>Drag your file(s) or <span className="text-[#98FF98]">browse</span></span>
            </div>
            <div className="text-gray-400 text-sm">Max 10 MB files are allowed</div>
          </div>
          <div className="text-gray-400 text-sm mt-[8px]">Only support .jpg, .png and .svg</div>
        </div>

        <div className="text-center text-gray-400 my-[16px]">OR</div>

        <div className="flex gap-[8px]">
          <input
            type="text"
            placeholder="Add file URL"
            className="flex-1 bg-[#3A3A3A] rounded-[8px] p-[12px] text-white placeholder-gray-400"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
          />
          <button className="bg-gradient-to-r from-[#98FF98] to-[#00FF00] text-black px-[16px] rounded-[8px]">
            Upload
          </button>
        </div>

        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between bg-[#3A3A3A] rounded-[8px] p-[12px]">
            <div className="flex items-center gap-[12px]">
              <div className="bg-[#0088CC] p-2 rounded-[8px]">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 18h12V6h-4V2H4v16zm2-6h8v2H6v-2zm0-3h8v2H6V9zm0-3h4v2H6V6z"/>
                </svg>
              </div>
              <div>
                <div className="text-white">{file.name}</div>
                <div className="text-gray-400 text-sm">{Math.round(file.size / 1000)}kb</div>
              </div>
            </div>
            <button onClick={() => handleRemoveFile(index)} className="text-[#98FF98]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        <button className="w-full bg-gradient-to-r from-[#98FF98] to-[#00FF00] text-black py-[12px] rounded-full mt-[24px] font-medium">
          Submit
        </button>
      </div>
    </div>
  );
}

function FileUploadArea() {
  const [files, setFiles] = useState([]);
  const [fileURL, setFileURL] = useState('');
  const dropzoneRef = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles([...files, ...acceptedFiles.map(file => ({
      name: file.name,
      size: Math.round(file.size / 1000),
      type: file.type
    }))]);
  }, [files]);

  const removeFile = (fileName) => {
    setFiles(files.filter(file => file.name !== fileName));
  };

  const handleURLUpload = () => {
    if (fileURL) {
      setFiles([...files, { name: fileURL.split('/').pop(), size: 500, type: 'url' }]);
      setFileURL('');
    }
  };

  return (
    <div className="w-full max-w-[800px] bg-[#2A2A2A] rounded-[12px] p-8">
      <p className="text-white mb-6">
        <span className="text-[#98ff98]">Please</span> note that all submitted <span className="text-[#98ff98]">products</span> go through an <span className="text-[#98ff98]">approval process</span>
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-white block mb-2">Title</label>
          <input 
            type="text"
            placeholder="Enter your Title"
            className="w-full bg-[#3A3A3A] rounded-lg p-3 text-white"
          />
        </div>

        <div>
          <label className="text-white block mb-2">URL</label>
          <input 
            type="text"
            placeholder="Enter your URL"
            className="w-full bg-[#3A3A3A] rounded-lg p-3 text-white"
          />
        </div>

        <div>
          <label className="text-white block mb-2">Description</label>
          <textarea 
            placeholder="Enter your Description"
            className="w-full bg-[#3A3A3A] rounded-lg p-3 text-white h-[120px]"
          />
        </div>

        <div 
          ref={dropzoneRef}
          className="border-2 border-dashed border-[#98ff98] rounded-lg p-8 text-center cursor-pointer hover:bg-[#3A3A3A] transition-colors"
          onClick={() => dropzoneRef.current?.click()}
        >
          <div className="text-[#98ff98] mb-2">
            <svg className="w-12 h-12 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-white mb-1">Drag your file(s) or <span className="text-[#98ff98]">browse</span></p>
          <p className="text-gray-400 text-sm">Max 10 MB files are allowed</p>
        </div>

        <p className="text-gray-400 text-sm">Only support .jpg, .png and .svg</p>

        <div className="text-center text-gray-400">OR</div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add file URL"
            value={fileURL}
            onChange={(e) => setFileURL(e.target.value)}
            className="flex-1 bg-[#3A3A3A] rounded-lg p-3 text-white"
          />
          <button
            onClick={handleURLUpload}
            className="bg-gradient-to-r from-[#98ff98] to-[#00ff00] text-black px-6 rounded-lg"
          >
            Upload
          </button>
        </div>

        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between bg-[#3A3A3A] rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="bg-[#4A90E2] p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-white">
                <div>{file.name}</div>
                <div className="text-sm text-gray-400">{file.size}kb</div>
              </div>
            </div>
            <button
              onClick={() => removeFile(file.name)}
              className="text-[#98ff98]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        <button className="w-full bg-gradient-to-r from-[#98ff98] to-[#00ff00] text-black py-3 rounded-full font-medium">
          Submit
        </button>
      </div>
    </div>
  );
}

function URLUploadSection() {
  const [fileUrl, setFileUrl] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: 1,
      name: 'Zoom.jpg',
      size: '500kb',
      icon: '📹'
    }
  ])

  const handleUpload = () => {
    if (!fileUrl) return
    // Upload logic would go here
  }

  const removeFile = (id) => {
    setUploadedFiles(files => files.filter(file => file.id !== id))
  }

  return (
    <div className="w-full space-y-6">
      <div className="w-full h-[200px] border-[2px] border-dashed border-[#98ff98]/30 rounded-xl flex flex-col items-center justify-center space-y-2">
        <div className="text-[#98ff98]">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="text-gray-300">
          Drag your file(s) or <span className="text-[#98ff98] cursor-pointer">browse</span>
        </div>
        <div className="text-gray-400 text-sm">Max 10 MB files are allowed</div>
      </div>

      <div className="text-gray-400 text-sm">Only support .jpg, .png and .svg</div>

      <div className="flex items-center gap-2 text-gray-400">
        <div className="h-[1px] flex-1 bg-gray-600"></div>
        <span>OR</span>
        <div className="h-[1px] flex-1 bg-gray-600"></div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="Add file URL"
          className="flex-1 bg-[#3a3a3a] rounded-lg px-4 py-3 text-gray-200 placeholder-gray-400 focus:outline-none"
        />
        <button
          onClick={handleUpload}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#98ff98] to-[#00ff00] text-gray-900 font-medium"
        >
          Upload
        </button>
      </div>

      {uploadedFiles.map(file => (
        <div key={file.id} className="flex items-center justify-between bg-[#3a3a3a] rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              {file.icon}
            </div>
            <div>
              <div className="text-gray-200">{file.name}</div>
              <div className="text-gray-400 text-sm">{file.size}</div>
            </div>
          </div>
          <button
            onClick={() => removeFile(file.id)}
            className="text-[#98ff98] hover:text-[#00ff00]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      <button className="w-full py-3 rounded-full bg-gradient-to-r from-[#98ff98] to-[#00ff00] text-gray-900 font-medium">
        Submit
      </button>
    </div>
  )
}

function Footer() {
  const links = {
    primary: ["About us", "Discover", "Explore", "News"],
    legal: ["Terms of Service", "Privacy Policy"]
  };

  const socialIcons = [
    { id: 'facebook', icon: 'facebook' },
    { id: 'twitter', icon: 'twitter' },
    { id: 'vimeo', icon: 'vimeo' },
    { id: 'youtube', icon: 'youtube' }
  ];

  return (
    <footer className="w-full bg-[#1C1C1E] text-white py-8">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <div className="flex gap-8">
            {links.primary.map((link) => (
              <a 
                key={link} 
                href="#" 
                className="text-[#FFFFFF99] hover:text-white text-[14px]"
              >
                {link}
              </a>
            ))}
          </div>
          
          <div className="flex gap-4">
            {socialIcons.map((social) => (
              <a
                key={social.id}
                href="#"
                className="w-[24px] h-[24px] flex items-center justify-center text-[#FFFFFF99] hover:text-white"
              >
                <i className={`fab fa-${social.icon}`}></i>
              </a>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-[#FFFFFF1A]">
          <div className="flex items-center">
            <img 
              src="/saasrow-logo.svg" 
              alt="SaaSRow" 
              className="h-[24px]"
            />
            <span className="text-[#FFFFFF99] text-[14px] ml-2">
              © 2019 SaaSRow. All rights reserved.
            </span>
          </div>

          <div className="flex gap-6">
            {links.legal.map((link) => (
              <a
                key={link}
                href="#"
                className="text-[#FFFFFF99] hover:text-white text-[14px]"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main App Component
function App() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <SubmitForm />
      <FormNotice />
      <FormFields />
      <FileUploadArea />
      <URLUploadSection />
      <Footer />
    </div>
  )
}