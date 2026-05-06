'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ContentViewerProps {
  url: string;
  title: string;
}

const ContentViewer = ({ url, title }: ContentViewerProps) => {
  const { t } = useTranslation(['dashboard']);
  const [showIframe, setShowIframe] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Video URL'lerini embed formatına çevir
  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    
    // YouTube
    const ytMatch = rawUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

    // Vimeo
    const vimeoMatch = rawUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[3]}`;

    return rawUrl;
  };

  const embedUrl = getEmbedUrl(url);
  const isVideo = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');

  if (!showIframe) {
    return (
      <button
        onClick={() => setShowIframe(true)}
        style={{
          flex: 1,
          padding: '10px',
          background: isVideo ? '#4f46e5' : '#3b82f6', // Video ise indigo, değilse mavi
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = isVideo ? '#4338ca' : '#2563eb')}
        onMouseLeave={(e) => (e.currentTarget.style.background = isVideo ? '#4f46e5' : '#3b82f6')}
      >
        <span>{isVideo ? '🎥' : '🔍'}</span> {isVideo ? t('dashboard.content.watch_btn') : t('dashboard.content.view_btn')}
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.95)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          background: '#1a1a1a',
          color: 'white',
          borderBottom: '1px solid #333',
        }}
      >
        <button
          onClick={() => setShowIframe(false)}
          style={{
            background: '#333',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
        <span style={{ fontSize: 14, flex: 1, fontWeight: 500 }}>{title}</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12,
            background: '#1D9E75',
            color: 'white',
            padding: '6px 12px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Yeni Sekmede Aç ↗
        </a>
      </div>

      {/* iframe veya fallback */}
      <div style={{ flex: 1, position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!iframeError ? (
          <iframe
            src={embedUrl}
            style={{ 
              width: isVideo ? 'min(100%, 1280px)' : '100%', 
              height: isVideo ? 'min(100%, 720px)' : '100%', 
              border: 'none',
              aspectRatio: isVideo ? '16/9' : 'auto'
            }}
            onError={() => setIframeError(true)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'white',
              gap: 20,
              padding: 20,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 40 }}>⚠️</div>
            <div style={{ fontSize: 16, maxWidth: 400 }}>Bu içerik güvenlik kısıtlamaları (X-Frame) nedeniyle burada görüntülenemiyor.</div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '12px 28px',
                background: '#1D9E75',
                color: 'white',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              İçeriği Yeni Sekmede Aç →
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentViewer;
