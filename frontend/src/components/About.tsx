import React from 'react';
import { motion } from 'framer-motion';
import MetaData from './MetaData';

const About = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  return (
    <>
      <MetaData 
        title="À propos - EasyVote"
        description="Découvrez EasyVote, l'application de sondage créée pour la communauté HACF"
        keywords="EasyVote, à propos, HACF, sondage, communauté"
      />
      <motion.div
        className="max-w-4xl mx-auto px-4 py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div className="bg-white shadow-lg rounded-lg overflow-hidden" variants={itemVariants}>
          <div className="p-8">
            <motion.h1 
              className="text-3xl font-bold text-blue-600 mb-6"
              variants={itemVariants}
            >
              À propos d'EasyVote
            </motion.h1>
            
            <motion.section className="mb-8" variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Notre Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                EasyVote est né d'une volonté simple : rendre la création et la gestion de sondages accessible à tous.
                Développé pour la communauté HACF (Home Assistant Communauté Francophone), notre application met l'accent
                sur la simplicité, la rapidité et l'efficacité.
              </p>
            </motion.section>

            <motion.section className="mb-8" variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Caractéristiques</h2>
              <ul className="space-y-3 text-gray-600">
                {[
                  'Création rapide de sondages',
                  'Interface intuitive et moderne',
                  'Partage facile des sondages',
                  'Résultats en temps réel'
                ].map((feature, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                  >
                    <svg className="h-5 w-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </motion.section>

            <motion.section className="mb-8" variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Technologie</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                EasyVote est construit avec des technologies modernes pour assurer performance et fiabilité :
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'React', type: 'Frontend' },
                  { name: 'Flask', type: 'Backend' },
                  { name: 'SQLite', type: 'Base de données' },
                  { name: 'Docker', type: 'Déploiement' }
                ].map((tech, index) => (
                  <motion.div
                    key={index}
                    className="bg-gray-50 p-3 rounded-lg text-center"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="font-semibold text-gray-700">{tech.name}</div>
                    <div className="text-sm text-gray-500">{tech.type}</div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            <motion.section variants={itemVariants}>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contribuer</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                EasyVote est un projet open source. Vous pouvez contribuer au projet sur GitHub ou rejoindre
                la communauté HACF pour partager vos idées et suggestions autour de domotique ou tous simplement
                utiliser EasyVote pour vos propres sondages.
              </p>
              <div className="flex space-x-4">
                <motion.a
                  href="https://github.com/barto95100/easyvote"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  GitHub
                  <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </motion.a>
                <motion.a
                  href="https://hacf.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  HACF
                  <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </motion.a>
              </div>
            </motion.section>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default About;