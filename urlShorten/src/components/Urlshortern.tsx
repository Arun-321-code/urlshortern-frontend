import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import config from '../config/envConfig'

interface Url {
  _id: string;
  original_url: string;
  short_url: string;
  redirect_count: number; 
}

interface UrlResponse {
  status: boolean;
  message: string;
  data: Url[];
  totalPages: number;
  currentPage: number;
  count: number;
}

const UrlFetcher: React.FC = () => {
  const [urlInput, setUrlInput] = useState<string>(""); 
  const [urls, setUrls] = useState<Url[]>([]); 
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1); 
  const [shortenedUrl, setShortenedUrl] = useState<string>(""); 
  const containerRef = useRef<HTMLDivElement>(null); 
  const showscroll = useRef(false)
  const BASE_URL = config.BASE_URL;

  const fetchUrls = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await axios.get<UrlResponse>(`${BASE_URL}/urlall`, {
        params: { page: pageNum, limit: 5 },
      });

      if (response.data.status) {
        setLoading(false);
        if (response.data.currentPage < response.data.totalPages) {
          showscroll.current = true
        } else {
          showscroll.current = false
        }

        setUrls((prevUrls) => {
          const newUrls = response.data.data.filter((url) => 
            !prevUrls.some((existingUrl) => existingUrl.short_url === url.short_url)
          );
          return [...prevUrls, ...newUrls];
        });
      } else {
        toast.error("Failed to fetch URLs.");
      }
    } catch (error) {
      console.error("Error fetching data", error);
      toast.error("Failed to fetch URLs.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchClick = async () => {
    if (!urlInput) {
      toast.error("URL is required!");
      return;
    }

    if (!isValidUrl(urlInput)) {
      toast.error("Please enter a valid URL!");
      return;
    }

    try {
      const response = await axios.post<{ shortUrl: string }>(`${BASE_URL}/url`, {
        originalUrl: urlInput,
      });
      setShortenedUrl(response.data.shortUrl);
      setUrlInput("");
      setUrls([]); 
      fetchUrls(1);
      toast.success("URL shortened successfully!");
    } catch (error) {
      console.error("Error creating shortened URL", error);
      toast.error("Failed to shorten URL.");
    }
  };


  const isValidUrl = (url: string): boolean => {
    const regex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    return regex.test(url);
  };

  const handleUrlClick = async (data: any) => {
    try {

      await axios.put(`${BASE_URL}/url?shortCode=${data._id}`);
      setUrls([]); 
      fetchUrls(1); 
      window.open(data.original_url, "_blank");
    } catch (error) {
      console.error("Error updating click count", error);
      toast.error("Error updating click count.");
    }
  };

  const handleScroll = async() => {
    console.log('scrolll',loading)
     if (showscroll.current) {
      const bottom = containerRef.current!.scrollHeight === 
                     containerRef.current!.scrollTop + containerRef.current!.clientHeight;
      if (bottom) {
        setPage(page+1)
        await fetchUrls(page+1)
       }
    }
  };

  const apicall = async()=>{
    await fetchUrls(page);
  }

  useEffect(()=>{
    apicall()
  },[])


  useEffect(() => {
    const container = containerRef.current;
  if(container){
      container.addEventListener("scroll", handleScroll);
    return () => {
        container.removeEventListener("scroll", handleScroll);
    }
    };
  }, [page]);

  return (
    <div className="url-fetcher-container" style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{textAlign:'center'}}>URL Shortener</h1>

      <div className="input-container" style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Enter the original URL"
          style={{
            width: "calc(100% - 100px)",
            padding: "10px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ddd",
          }}
        />
        <button
          onClick={handleFetchClick}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            marginLeft: "10px",
            cursor: "pointer",
            backgroundColor: "#1a73e8",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Get Shortened URL
        </button>
      </div>

      {shortenedUrl && (
        <div className="shortened-url" style={{ marginBottom: "20px" }}>
          <strong>Shortened URL:</strong> <a href={shortenedUrl} target="_blank" rel="noopener noreferrer">{shortenedUrl}</a>
        </div>
      )}

      <div
        className="url-list-container"
        ref={containerRef}
        style={{
          maxHeight: "140px",
          overflowY: "auto",
          border: "1px solid #ddd",
          padding: "10px",
        }}
      >
        {urls.length === 0 && !loading && <p>No URLs found.</p>}
        {urls.map((url, index) => (
          <div
            key={index}
            className="url-item"
            onClick={() => handleUrlClick(url)} 
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid #eee",
              cursor: "pointer",
            }}
          >
            <span className="url-click-count" style={{ fontSize: "14px", color: "#888" }}>
              {url.redirect_count} clicks
            </span>
            <a href="#" style={{ textDecoration: "none", color: "#1a73e8", fontSize: "16px" }}>
              {url.short_url}
            </a>
          </div>
        ))}
        {loading && <p>Loading more...</p>}
      </div>

      <ToastContainer />
    </div>
  );
};

export default UrlFetcher;
