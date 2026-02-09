'use client';

import { useState, useEffect, useRef } from 'react';
import { Filter, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  allTags: string[];
  translations: {
    allProjects: string;
    clearFilters: string;
    noResults: string;
    filterBy: string;
    searchPlaceholder: string;
    searchLabel: string;
  };
  totalProjects: number;
}

export default function ProjectFilter({ allTags, translations, totalProjects }: Props) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(totalProjects);
  const [availableTags, setAvailableTags] = useState<string[]>(allTags);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Aplicar filtro a las tarjetas del DOM
    const projectCards = document.querySelectorAll('[data-project-tags]');
    let count = 0;
    const tagsInFilteredProjects = new Set<string>();
    const query = searchQuery.toLowerCase().trim();

    projectCards.forEach((card) => {
      const projectTags = (card.getAttribute('data-project-tags') || '').split(',').filter(Boolean);
      const projectTitle = (card.getAttribute('data-project-title') || '').toLowerCase();
      const projectSummary = (card.getAttribute('data-project-summary') || '').toLowerCase();

      // Verificar si coincide con la búsqueda de texto
      const matchesSearch =
        query === '' ||
        projectTitle.includes(query) ||
        projectSummary.includes(query) ||
        projectTags.some((tag) => tag.toLowerCase().includes(query));

      // Verificar si coincide con los tags seleccionados
      const matchesTags =
        selectedTags.length === 0 || selectedTags.some((tag) => projectTags.includes(tag));

      // Mostrar solo si coincide con ambos filtros
      const shouldShow = matchesSearch && matchesTags;

      (card as HTMLElement).style.display = shouldShow ? '' : 'none';

      if (shouldShow) {
        count++;
        // Agregar tags de proyectos visibles
        projectTags.forEach((tag) => tagsInFilteredProjects.add(tag));
      }
    });

    setVisibleCount(count);

    // Actualizar tags disponibles basándose en proyectos filtrados
    const newAvailableTags = allTags.filter((tag) => tagsInFilteredProjects.has(tag));
    setAvailableTags(newAvailableTags);
  }, [selectedTags, searchQuery, allTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedTags.length > 0 || searchQuery.length > 0;

  // Función para actualizar visibilidad de flechas
  const updateArrows = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Función para hacer scroll
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 200;
    const newScrollLeft =
      direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  // Actualizar flechas cuando cambien los tags disponibles o el tamaño
  useEffect(() => {
    updateArrows();

    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => updateArrows();
    const handleResize = () => updateArrows();

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [availableTags]);

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{translations.filterBy}</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <X size={16} />
            {translations.clearFilters}
          </button>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={translations.searchPlaceholder}
            className="w-full rounded-lg border border-border bg-background py-2.5 pr-4 pl-10 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tags como botones con scroll horizontal */}
      <div className="relative">
        {/* Botón izquierdo */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute top-1/2 left-0 z-10 -translate-y-1/2 rounded-full border border-border bg-background/95 p-2 shadow-lg transition-colors hover:bg-accent"
            aria-label="Scroll izquierda"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Contenedor scrolleable */}
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide flex flex-row gap-2 overflow-x-auto scroll-smooth px-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'border border-border bg-background text-foreground hover:border-primary hover:bg-primary/10'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Botón derecho */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute top-1/2 right-0 z-10 -translate-y-1/2 rounded-full border border-border bg-background/95 p-2 shadow-lg transition-colors hover:bg-accent"
            aria-label="Scroll derecha"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="mt-4 text-sm text-muted-foreground">
        {!hasActiveFilters ? (
          <span>
            {translations.allProjects}: <strong>{totalProjects}</strong>
          </span>
        ) : (
          <span>
            {visibleCount} de {totalProjects} proyectos
          </span>
        )}
      </div>

      {/* Mensaje cuando no hay resultados */}
      {hasActiveFilters && visibleCount === 0 && (
        <div className="mt-6 rounded-lg bg-muted p-4 text-center">
          <p className="text-muted-foreground">{translations.noResults}</p>
        </div>
      )}
    </div>
  );
}
