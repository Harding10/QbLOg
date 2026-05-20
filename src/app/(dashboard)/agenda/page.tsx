"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserEvents, createEvent, deleteEvent, CalendarEvent } from "@/lib/firebase/services/events";
import { Plus, Trash2, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO
} from "date-fns";
import { fr } from "date-fns/locale";

export default function AgendaPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", time: "12:00" });

  const getEventDate = (dateObj: any): Date => {
    if (!dateObj) return new Date();
    if (typeof dateObj.toDate === 'function') return dateObj.toDate();
    if (dateObj instanceof Date) return dateObj;
    if (dateObj.seconds) return new Date(dateObj.seconds * 1000);
    return new Date(dateObj);
  };

  const fetchEvents = async () => {
    if (user) {
      const fetched = await getUserEvents(user.uid);
      setEvents(fetched);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newEvent.title) return;
    
    // Combiner la date sélectionnée et l'heure
    const [hours, minutes] = newEvent.time.split(':');
    const eventDate = new Date(selectedDate);
    eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    await createEvent({
      title: newEvent.title,
      description: newEvent.description,
      date: Timestamp.fromDate(eventDate),
      userId: user.uid
    });
    
    setShowNewModal(false);
    setNewEvent({ title: "", description: "", time: "12:00" });
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cet événement ?")) {
      setEvents(events.filter(e => e.id !== id));
      await deleteEvent(id);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const onDateClick = (day: Date) => setSelectedDate(day);

  // Rendu des jours de la semaine (Lun, Mar...)
  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // 1 = Lundi
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-medium text-sm text-gray-500 py-2 border-b border-gray-200 dark:border-gray-800" key={i}>
          {format(addDays(startDate, i), dateFormat, { locale: fr }).substring(0, 3)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  // Rendu de la grille des jours
  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        // Vérifier si ce jour a des événements
        const dayEvents = events.filter(e => isSameDay(getEventDate(e.date), cloneDay));

        days.push(
            <div
              className={`min-h-[100px] border p-2 cursor-pointer transition-all duration-200 ${
                !isSameMonth(day, monthStart)
                  ? "bg-gray-50 dark:bg-dark-primary/50 border-gray-100 dark:border-gray-800/50 text-gray-400 dark:text-gray-600"
                  : isSameDay(day, selectedDate)
                  ? "bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/50 shadow-sm"
                  : "bg-transparent border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
              key={day.toString()}
              onClick={() => onDateClick(cloneDay)}
            >
              <div className="flex justify-between items-start">
                <span className={`font-medium w-6 h-6 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? "bg-primary-500 text-white text-xs" : ""}`}>
                  {formattedDate}
                </span>
                {dayEvents.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1 mr-1 shadow-sm"></span>
                )}
              </div>
              <div className="mt-2 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map(e => (
                  <div key={e.id} className="text-[10px] leading-tight truncate px-1.5 py-0.5 bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 rounded border border-primary-200 dark:border-primary-500/30">
                    {format(getEventDate(e.date), "HH:mm")} - {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && <div className="text-[10px] text-gray-500 dark:text-gray-400 px-1 font-medium">+{dayEvents.length - 3} autres</div>}
              </div>
            </div>
          );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div className="bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">{rows}</div>;
  };

  const selectedDateEvents = events.filter(e => isSameDay(getEventDate(e.date), selectedDate));

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-5 md:px-12 pt-10 pb-32">
      <div className="lg:col-span-3 space-y-6">
        <header className="flex justify-between items-center bg-white dark:bg-dark-primary p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-50 dark:bg-primary-500/10 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </h1>
          </div>
          <div className="flex gap-2 bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            <button onClick={prevMonth} className="p-2 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-2 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </header>
        
        <div>
          {renderDays()}
          {renderCells()}
        </div>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-dark-primary p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm h-full flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center justify-between">
            {format(selectedDate, "d MMMM", { locale: fr })}
            <button 
              onClick={() => setShowNewModal(true)}
              className="p-1.5 bg-primary-500 hover:bg-primary-600 rounded-lg text-white transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
            </button>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">Événements de la journée</p>

          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm flex flex-col items-center">
                <Clock className="w-8 h-8 mb-2 opacity-20" />
                Aucun événement prévu.
              </div>
            ) : (
              selectedDateEvents.map(event => (
                <div key={event.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary-500/30 transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-500 transition-colors">{event.title}</h3>
                    <button 
                      onClick={() => handleDelete(event.id!)}
                      className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-400/10 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center text-xs text-primary-500 mb-2">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(getEventDate(event.date), "HH:mm")}
                  </div>
                  {event.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mt-2">{event.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Ajout */}
      {showNewModal && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-primary rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Nouvel Événement</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Pour le {format(selectedDate, "d MMMM yyyy", { locale: fr })}</p>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
                <input required type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full rounded-xl bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white p-2.5 focus:border-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heure</label>
                <input required type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full rounded-xl bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white p-2.5 focus:border-primary-500 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optionnelle)</label>
                <textarea rows={3} value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full rounded-xl bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white p-2.5 resize-none focus:border-primary-500 focus:outline-none" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors">Annuler</button>
                <button type="submit" className="px-5 py-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
