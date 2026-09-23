import { useEffect, useMemo, useRef, useState } from "react";
import { Empty, Select, Tag, Typography } from "antd";
import type { HistoricalTimeline } from "./types";
import { EmptyState, RowActions } from "./shared";

const { Text, Title } = Typography;

type TimelineEntry = HistoricalTimeline & { yearValue: number; dateKey: string };

type HistoricalTimelineModuleProps = {
  items: HistoricalTimeline[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (item: HistoricalTimeline) => void;
  onDelete?: (id: string) => void;
};

const categoryColors: Record<string, string> = {
  Fundacional: "gold",
  "Estructura Legal": "blue",
  Infraestructura: "green",
  Concesiones: "cyan",
  Transformación: "purple",
  Estrategia: "magenta",
};

const parseYear = (value: HistoricalTimeline["year"]) => {
  const date = new Date(value as unknown as string);
  return Number.isNaN(date.getTime()) ? 0 : date.getFullYear();
};

const formatDate = (dateKey: string) =>
  new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateKey}T12:00:00`));

export const HistoricalTimelineModule: React.FC<HistoricalTimelineModuleProps> = ({
  items,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>();
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const itemRefs = useRef(new Map<string, HTMLDivElement>());

  const entries = useMemo<TimelineEntry[]>(
    () =>
      items.map((item) => {
        const date = new Date(item.year as unknown as string);
        const dateKey = Number.isNaN(date.getTime())
          ? String(item.year)
          : date.toISOString().slice(0, 10);
        return { ...item, yearValue: parseYear(item.year), dateKey };
      }),
    [items],
  );
  const years = useMemo(
    () => Array.from(new Set(entries.map((item) => item.yearValue))).filter(Boolean).sort((a, b) => b - a),
    [entries],
  );
  const filteredEntries = useMemo(
    () => entries.filter((item) => !selectedYear || item.yearValue === selectedYear),
    [entries, selectedYear],
  );
  const groups = useMemo(() => {
    const byYear = new Map<number, Map<string, TimelineEntry[]>>();
    filteredEntries.forEach((entry) => {
      const dates = byYear.get(entry.yearValue) || new Map<string, TimelineEntry[]>();
      dates.set(entry.dateKey, [...(dates.get(entry.dateKey) || []), entry]);
      byYear.set(entry.yearValue, dates);
    });
    return Array.from(byYear.entries()).sort(([left], [right]) => right - left);
  }, [filteredEntries]);

  useEffect(() => {
    setSelectedYear((current) => (current && years.includes(current) ? current : undefined));
  }, [years]);

  useEffect(() => {
    setVisibleItems(new Set());
    const observer = new IntersectionObserver(
      (observedItems) => {
        setVisibleItems((current) => {
          const next = new Set(current);
          observedItems.forEach((item) => {
            if (item.isIntersecting) next.add(item.target.getAttribute("data-timeline-id") || "");
          });
          return next;
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8%" },
    );
    itemRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [groups]);

  if (!items.length) return <EmptyState label="línea de tiempo histórica" />;

  return (
    <section className="historical-timeline" aria-label="Línea de tiempo histórica">
      <div className="historical-timeline-heading">
        <div>
          <Title level={4}>Línea de tiempo histórica</Title>
          
        </div>
        <Select
          allowClear
          value={selectedYear}
          placeholder="Filtrar por año"
          options={years.map((year) => ({ label: year, value: year }))}
          onChange={setSelectedYear}
          className="historical-timeline-filter"
        />
      </div>
      {!groups.length ? (
        <Empty description="No hay registros para el año seleccionado" />
      ) : (
        <div className="historical-timeline-track">
          {groups.map(([year, dates]) => (
            <section className="historical-timeline-year" key={year}>
              <div className="historical-timeline-year-label">{year}</div>
              {Array.from(dates.entries()).map(([dateKey, dateEntries]) => (
                <div className="historical-timeline-date-group" key={dateKey}>
                  <div className="historical-timeline-date">{formatDate(dateKey)}</div>
                  <div className="historical-timeline-date-items">
                    {dateEntries.map((entry, index) => (
                      <div
                        className={`historical-timeline-entry historical-timeline-entry-${index % 2 ? "right" : "left"} ${visibleItems.has(entry.id) ? "is-visible" : ""}`}
                        data-timeline-id={entry.id}
                        key={entry.id}
                        ref={(element) => {
                          if (element) itemRefs.current.set(entry.id, element);
                          else itemRefs.current.delete(entry.id);
                        }}
                      >
                        <article className="historical-timeline-card">
                          <div className="historical-timeline-card-header">
                            <Tag color={categoryColors[entry.category] || "default"}>{entry.category}</Tag>
                            {(canEdit || canDelete) && (
                              <RowActions item={entry} canEdit={canEdit} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
                            )}
                          </div>
                          <Title level={5}>{entry.title}</Title>
                          <p>{entry.description}</p>
                        </article>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </section>
  );
};
