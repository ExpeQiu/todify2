import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { CarSeries, CarSeriesFormData, CarSeriesSearchParams, UpdateCarSeriesFormData } from '../types/carSeries';
import { useCarSeries, useCarSeriesStats } from '../hooks/useCarSeries';
import CarSeriesList from '../components/carSeries/CarSeriesList';
import CarSeriesForm from '../components/carSeries/CarSeriesForm';
import CarSeriesStats from '../components/carSeries/CarSeriesStats';
import CarSeriesDetail from '../components/carSeries/CarSeriesDetail';

const CarSeriesManagement: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingCarSeries, setEditingCarSeries] = useState<CarSeries | undefined>();
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCarSeries, setSelectedCarSeries] = useState<CarSeries | undefined>();
  const [showStats, setShowStats] = useState(false);
  const [searchParams, setSearchParams] = useState<CarSeriesSearchParams>({
    keyword: '',
    page: 1,
    pageSize: 20
  });

  const {
    carSeries,
    loading,
    error,
    pagination,
    fetchCarSeries,
    createCarSeries,
    updateCarSeries,
    discontinueCarSeries,
    deleteCarSeries,
    searchCarSeries
  } = useCarSeries();

  // 初始加载数据
  useEffect(() => {
    fetchCarSeries();
  }, [fetchCarSeries]);

  const handleCreateNew = () => {
    setEditingCarSeries(undefined);
    setShowForm(true);
  };

  const handleEdit = (carSeries: CarSeries) => {
    setEditingCarSeries(carSeries);
    setShowForm(true);
  };

  const handleView = (carSeries: CarSeries) => {
    setSelectedCarSeries(carSeries);
    setShowDetail(true);
  };

  const handleSearch = (params: CarSeriesSearchParams) => {
    setSearchParams(params);
    if (params.keyword?.trim()) {
      searchCarSeries(params.keyword, params);
    } else {
      fetchCarSeries(params);
    }
  };

  const handleReset = () => {
    const resetParams = { page: 1, pageSize: 20, keyword: '' };
    setSearchParams(resetParams);
    fetchCarSeries(resetParams);
  };

  const handlePageChange = (page: number) => {
    const newParams = { ...searchParams, page };
    setSearchParams(newParams);
    if (searchParams.keyword?.trim()) {
      searchCarSeries(searchParams.keyword, newParams);
    } else {
      fetchCarSeries(newParams);
    }
  };

  const handleFormSubmit = async (data: CarSeriesFormData | UpdateCarSeriesFormData): Promise<boolean> => {
    try {
      if (editingCarSeries) {
        const success = await updateCarSeries(editingCarSeries.id, data as UpdateCarSeriesFormData);
        if (success) {
          console.log('车系更新成功');
          setShowForm(false);
          setEditingCarSeries(undefined);
          return true;
        }
        return false;
      } else {
        const success = await createCarSeries(data as CarSeriesFormData);
        if (success) {
          console.log('车系创建成功');
          setShowForm(false);
          return true;
        }
        return false;
      }
    } catch (err) {
      console.error('操作失败:', err);
      return false;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const success = await deleteCarSeries(id);
      if (success) {
        console.log('车系删除成功');
      }
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleDiscontinue = async (id: number) => {
    try {
      const success = await discontinueCarSeries(id);
      if (success) {
        console.log('车系已停产');
      }
    } catch (err) {
      console.error('停产操作失败:', err);
    }
  };

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <CarSeriesList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreateNew}
      />

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CarSeriesForm
              carSeries={editingCarSeries}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingCarSeries(undefined);
              }}
            />
          </div>
        </div>
      )}

      {showDetail && selectedCarSeries && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CarSeriesDetail
              carSeries={selectedCarSeries}
              onClose={() => {
                setShowDetail(false);
                setSelectedCarSeries(undefined);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CarSeriesManagement;