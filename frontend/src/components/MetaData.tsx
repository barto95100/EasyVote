import React from 'react';
import { Helmet } from 'react-helmet-async';

interface MetaDataProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

const MetaData: React.FC<MetaDataProps> = ({
  title = 'EasyVote - Simple. Rapide. Efficace.',
  description = 'Application de sondage simple et efficace pour la communauté HACF',
  keywords = 'sondage, vote, HACF, Home Assistant, communauté francophone',
  ogTitle = title,
  ogDescription = description,
  ogImage = '/logo-easyvote-slogan.svg'
}) => {
  return (
    <Helmet>
      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon_easyvote.svg" />
      <link rel="alternate icon" href="/favicon.ico" />
      <link rel="mask-icon" href="/favicon_easyvote.svg" color="#3B82F6" />

      {/* Balises meta standard */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="EasyVote" />
      <meta property="og:image:type" content="image/svg+xml" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Autres meta tags importants */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html;charset=UTF-8" />
      <meta name="theme-color" content="#3B82F6" />
      <meta name="robots" content="index,follow" />
      <meta name="language" content="French" />
    </Helmet>
  );
};

export default MetaData;