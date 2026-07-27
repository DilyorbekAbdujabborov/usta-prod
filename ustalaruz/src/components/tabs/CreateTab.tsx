import { PlusCircle, CheckCircle2, MapPin, Map } from 'lucide-react';
import { store } from '../UstaApp.store';
import { CATEGORIES } from '../../lib/categories';
import { REGION_DATA } from '../../lib/regions';

export default function CreateTab() {
  const {
    newOrderTitle, setNewOrderTitle,
    newOrderCategory, setNewOrderCategory,
    newOrderBudget, setNewOrderBudget,
    newOrderDesc, setNewOrderDesc,
    selectedRegion, setSelectedRegion,
    selectedDistrict, setSelectedDistrict,
    handleCreateOrder,
  } = store;

  const orderCategories = CATEGORIES.filter(c => c.id !== 'all');

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-black flex items-center gap-1.5 text-text-primary">
          <PlusCircle size={16} className="text-brand" />
          Yangi buyurtma berish
        </h3>
        <p className="text-[10px] text-text-secondary mt-1 font-bold">
          Yaqin atrofdagi ustalarga ko'rinishi uchun formani to'ldiring
        </p>
      </div>

      <form
        onSubmit={handleCreateOrder}
        className="flex flex-col gap-3.5"
      >
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary block mb-1">
            Buyurtma sarlavhasi
          </label>
          <input
            type="text"
            value={newOrderTitle}
            onChange={(e) => setNewOrderTitle(e.target.value)}
            placeholder="Masalan: Uy krantini ta'mirlash"
            className="w-full text-xs font-bold p-3 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary block mb-1">
            Kategoriya (Soha)
          </label>
          <select
            value={newOrderCategory}
            onChange={(e) => setNewOrderCategory(e.target.value)}
            className="w-full text-xs font-bold p-3 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border"
          >
            {orderCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary block mb-1">
            Taklif etilayotgan byudjet (so'm)
          </label>
          <input
            type="number"
            value={newOrderBudget}
            onChange={(e) => setNewOrderBudget(e.target.value)}
            placeholder="Masalan: 70000"
            className="w-full text-xs font-bold p-3 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary block mb-1">
            Batafsil tavsif
          </label>
          <textarea
            value={newOrderDesc}
            onChange={(e) => setNewOrderDesc(e.target.value)}
            placeholder="Kerakli xizmat turi va sharoitlarni bu yerda batafsil yozib qoldiring..."
            rows={4}
            className="w-full text-xs font-bold p-3 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none bg-surface-input border-border"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary block mb-1 flex items-center gap-1">
              <MapPin size={11} /> Shahar / Viloyat
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedDistrict(REGION_DATA[e.target.value]?.[0] || '');
              }}
              className="w-full text-xs font-bold p-3 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border"
            >
              {Object.keys(REGION_DATA).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary block mb-1 flex items-center gap-1">
              <Map size={11} /> Tuman / Hudud
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-xs font-bold p-3 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border"
            >
              {(REGION_DATA[selectedRegion] || []).map((d: string) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-extrabold rounded-xl shadow-lg shadow-blue-950/15 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 size={15} />
          Buyurtmani e'longa chiqarish
        </button>
      </form>
    </div>
  );
}
