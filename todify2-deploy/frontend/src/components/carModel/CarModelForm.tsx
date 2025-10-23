import React, { useState, useEffect } from "react";
import { X, Save, Car, Calendar, Target, Tag } from "lucide-react";
import {
  CarModel,
  CarModelFormData,
  CarModelStatus,
} from "../../types/carModel";
import { Brand } from "../../types/brand";
import { CarSeries } from "../../types/carSeries";
import { carModelService } from "../../services/carModelService";
import { brandService } from "../../services/brandService";
import { carSeriesService } from "../../services/carSeriesService";

interface CarModelFormProps {
  carModel?: CarModel | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CarModelForm: React.FC<CarModelFormProps> = ({
  carModel,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CarModelFormData>({
    name: "",
    brand_id: 0,
    category: "",
    launch_year: new Date().getFullYear(),
    end_year: undefined,
    market_segment: "",
    status: CarModelStatus.ACTIVE,
    metadata: {},
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [carSeries, setCarSeries] = useState<CarSeries[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number>(0);

  // 初始化表单数据
  useEffect(() => {
    if (carModel) {
      setFormData({
        name: carModel.name || "",
        brand_id: carModel.brand_id || 0,
        category: carModel.category || "",
        launch_year: carModel.launch_year || new Date().getFullYear(),
        end_year: carModel.end_year,
        market_segment: carModel.market_segment || "",
        status: carModel.status || CarModelStatus.ACTIVE,
        metadata: carModel.metadata || {},
      });
      setSelectedBrandId(carModel.brand_id || 0);
    }
  }, [carModel]);

  // 获取品牌列表
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await brandService.getAll();
        if (response.data) {
          setBrands(response.data);
        }
      } catch (err) {
        console.error("获取品牌列表失败:", err);
      }
    };

    fetchBrands();
  }, []);

  // 获取车系列表
  useEffect(() => {
    const fetchCarSeries = async () => {
      if (selectedBrandId) {
        try {
          const response = await carSeriesService.getByBrand(selectedBrandId);
          if (response.data) {
            setCarSeries(response.data);
          }
        } catch (err) {
          console.error("获取车系列表失败:", err);
          setCarSeries([]);
        }
      } else {
        setCarSeries([]);
      }
    };

    fetchCarSeries();
  }, [selectedBrandId]);

  // 处理表单字段变化
  const handleChange = (field: keyof CarModelFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // 清除错误信息
    if (error) {
      setError(null);
    }
  };

  // 处理品牌选择变化
  const handleBrandChange = (brandId: number) => {
    setSelectedBrandId(brandId);
    handleChange("brand_id", brandId);
    // 清空车系选择
    setCarSeries([]);
  };

  // 表单验证
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("请输入车型名称");
      return false;
    }

    if (!formData.brand_id) {
      setError("请选择品牌");
      return false;
    }

    if (
      !formData.launch_year ||
      formData.launch_year < 1900 ||
      formData.launch_year > new Date().getFullYear() + 5
    ) {
      setError("请输入有效的上市年份");
      return false;
    }

    return true;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      if (carModel) {
        response = await carModelService.update(carModel.id, formData);
      } else {
        response = await carModelService.create(formData);
      }

      if (response.data) {
        onSuccess();
      } else {
        setError("保存车型失败");
      }
    } catch (err) {
      setError("保存车型失败");
    } finally {
      setLoading(false);
    }
  };

  // 生成年份选项
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear + 5; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  };

  return (
    <div className="bg-white" data-oid="85v.r6i">
      {/* 头部 */}
      <div
        className="flex items-center justify-between p-6 border-b border-gray-200"
        data-oid="gfxou9r"
      >
        <h2
          className="text-lg font-medium text-gray-900 flex items-center gap-2"
          data-oid="3z22g-."
        >
          <Car className="w-5 h-5" data-oid="dg-fjap" />
          {carModel ? "编辑车型" : "新建车型"}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
          data-oid="wul_83t"
        >
          <X className="w-6 h-6" data-oid="3v8uo1o" />
        </button>
      </div>

      {/* 表单内容 */}
      <form
        onSubmit={handleSubmit}
        className="p-6 space-y-6"
        data-oid="eyhu__d"
      >
        {/* 错误提示 */}
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            data-oid="w7z3lkh"
          >
            {error}
          </div>
        )}

        {/* 基本信息 */}
        <div className="space-y-4" data-oid="-igp4:m">
          <h3
            className="text-sm font-medium text-gray-900 flex items-center gap-2"
            data-oid=":cjlle:"
          >
            <Tag className="w-4 h-4" data-oid="2_o4ixz" />
            基本信息
          </h3>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            data-oid="0ohqucf"
          >
            <div data-oid="63juqfn">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                data-oid="8lwk3ql"
              >
                车型名称{" "}
                <span className="text-red-500" data-oid="4wi9kkv">
                  *
                </span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入车型名称"
                required
                data-oid=":26-84n"
              />
            </div>

            <div data-oid="682zuyu">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                data-oid="07ysktm"
              >
                品牌{" "}
                <span className="text-red-500" data-oid="ca.fm:e">
                  *
                </span>
              </label>
              <select
                value={formData.brand_id}
                onChange={(e) => handleBrandChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                data-oid="1bkhlkv"
              >
                <option value={0} data-oid="w:wf:1y">
                  请选择品牌
                </option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id} data-oid="obbjkdx">
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div data-oid="m..9p6f">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                data-oid="zeds-93"
              >
                车型类别
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入车型类别"
                data-oid="qh67czq"
              />
            </div>

            <div data-oid="vdl--h0">
              <label
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
                data-oid="_gvpk46"
              >
                <Calendar className="w-4 h-4" data-oid="9w0:_3o" />
                上市年份{" "}
                <span className="text-red-500" data-oid="o8sln-x">
                  *
                </span>
              </label>
              <select
                value={formData.launch_year}
                onChange={(e) =>
                  handleChange("launch_year", Number(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                data-oid="ll-6cwp"
              >
                <option value="" data-oid="e.::lh7">
                  请选择年份
                </option>
                {generateYearOptions().map((year) => (
                  <option key={year} value={year} data-oid="zyq8cj.">
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div data-oid="vjf72_2">
              <label
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
                data-oid="nral2q7"
              >
                <Calendar className="w-4 h-4" data-oid="5arvzyz" />
                停产年份
              </label>
              <select
                value={formData.end_year || ""}
                onChange={(e) =>
                  handleChange(
                    "end_year",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-oid="03bjmg0"
              >
                <option value="" data-oid="0cak83z">
                  仍在生产
                </option>
                {generateYearOptions().map((year) => (
                  <option key={year} value={year} data-oid="trcm4m.">
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div data-oid="hav5aiz">
              <label
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
                data-oid="0.a0.e6"
              >
                <Target className="w-4 h-4" data-oid="c.:gz13" />
                市场定位
              </label>
              <select
                value={formData.market_segment}
                onChange={(e) => handleChange("market_segment", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-oid="y6em4ra"
              >
                <option value="" data-oid="tb99y_g">
                  请选择市场定位
                </option>
                <option value="economy" data-oid="yyd56:c">
                  经济型
                </option>
                <option value="compact" data-oid="yr-k4ix">
                  紧凑型
                </option>
                <option value="mid-size" data-oid="kbi1.4_">
                  中型
                </option>
                <option value="full-size" data-oid="jqv4p-n">
                  大型
                </option>
                <option value="luxury" data-oid="kw53.vj">
                  豪华型
                </option>
                <option value="sports" data-oid="1-ep8wb">
                  运动型
                </option>
                <option value="suv" data-oid="nx33d3l">
                  SUV
                </option>
                <option value="mpv" data-oid="q:eu05y">
                  MPV
                </option>
                <option value="pickup" data-oid="m-8s5ak">
                  皮卡
                </option>
              </select>
            </div>

            <div data-oid="4cgxv2q">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                data-oid="rgcnf_e"
              >
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  handleChange("status", e.target.value as CarModelStatus)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-oid="tj:h914"
              >
                <option value={CarModelStatus.ACTIVE} data-oid="plv-13v">
                  在产
                </option>
                <option value={CarModelStatus.DISCONTINUED} data-oid="f33np.3">
                  停产
                </option>
                <option value={CarModelStatus.PLANNED} data-oid="s_e:0id">
                  计划中
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div
          className="flex justify-end gap-3 pt-6 border-t border-gray-200"
          data-oid="cz_9228"
        >
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            data-oid="kjcm:y3"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            data-oid="p9914js"
          >
            <Save className="w-4 h-4" data-oid="g7lp6lk" />
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CarModelForm;
