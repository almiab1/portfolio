'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Container, ISourceOptions } from '@tsparticles/engine';

const NeuralBackground = () => {
  const [init, setInit] = useState(false);
  // Estado para el color actual
  const [colors, setColors] = useState({
    particles: '#ad5837',
    links: '#a39389',
  });

  useEffect(() => {
    // Función para actualizar colores basados en el tema
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');

      if (isDark) {
        // Colores para modo oscuro (más brillantes/claros)
        setColors({
          particles: '#e08c6c', // Tono salmón suave
          links: '#52525b', // Gris oscuro (Zinc-600)
        });
      } else {
        // Colores para modo claro (más oscuros/saturados)
        setColors({
          particles: '#ad5837', // Tono terracota (Primary)
          links: '#a8a29e', // Gris cálido (Stone-400)
        });
      }
    };

    // Ejecutar al inicio
    updateTheme();

    // Observar cambios en la clase 'dark' del elemento html
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Inicializar motor de partículas
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'grab',
          },
        },
        modes: {
          grab: {
            distance: 140,
            links: {
              opacity: 0.8,
              color: colors.particles, // Al interactuar usa el color principal
            },
          },
        },
      },
      particles: {
        color: {
          value: colors.particles,
        },
        links: {
          color: colors.links,
          distance: 150,
          enable: true,
          opacity: 0.4,
          width: 1,
        },
        move: {
          direction: 'none',
          enable: true,
          outModes: {
            default: 'bounce',
          },
          random: false,
          speed: 0.8,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 50,
        },
        opacity: {
          value: 0.6,
        },
        shape: {
          type: 'circle',
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: true,
    }),
    [colors], // Recalcular cuando cambien los colores
  );

  if (!init) {
    return null;
  }

  return <Particles id="tsparticles" className="fixed inset-0 -z-10" options={options} />;
};

export default NeuralBackground;
