import React, { useState, useEffect } from 'react'
import { BarChart3, Download, Calendar, Car, Users, FileText, Filter, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUserRole } from '../../hooks/useUserRole'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { LoadingSpinner } from '../ui/LoadingSpinner'


interface ReporteData {
  rentas: any[]
  totalRentas: number
  ingresoTotal: number
  vehiculoMasRentado?: any
  clienteFrecuente?: any
  empleadoDestacado?: any
}

export function Reportes() {
  const { isSuperAdmin, tenantId } = useUserRole()
  const [reporteData, setReporteData] = useState<ReporteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [aplicandoFiltros, setAplicandoFiltros] = useState(false)
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipoVehiculo: '',
    cliente: '',
    empleado: ''
  })
  const [tiposVehiculo, setTiposVehiculo] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [estadoRenta, setEstadoRenta] = useState('')

  useEffect(() => {
    loadOptions()
    const hoy = new Date()
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    
    setFiltros(prev => ({
      ...prev,
      fechaInicio: primerDia.toISOString().split('T')[0],
      fechaFin: ultimoDia.toISOString().split('T')[0]
    }))
  }, [])

  async function loadOptions() {
    try {
      let tiposQuery = supabase.from('tipos_vehiculos').select('*').eq('estado', true)
      let clientesQuery = supabase.from('clientes').select('*').eq('estado', true)
      let empleadosQuery = supabase.from('empleados').select('*').eq('estado', true)

      if (!isSuperAdmin && tenantId) {
        tiposQuery = tiposQuery.eq('tenant_id', tenantId)
        clientesQuery = clientesQuery.eq('tenant_id', tenantId)
        empleadosQuery = empleadosQuery.eq('tenant_id', tenantId)
      }

      const [tiposRes, clientesRes, empleadosRes] = await Promise.all([
        tiposQuery,
        clientesQuery,
        empleadosQuery
      ])

      setTiposVehiculo(tiposRes.data || [])
      setClientes(clientesRes.data || [])
      setEmpleados(empleadosRes.data || [])
    } catch (error) {
      console.error('Error loading options:', error)
    }
  }

  async function generarReporte() {
    if (!filtros.fechaInicio || !filtros.fechaFin) {
      alert('Por favor selecciona las fechas de inicio y fin')
      return
    }

    if (new Date(filtros.fechaInicio) > new Date(filtros.fechaFin)) {
      alert('La fecha de inicio no puede ser mayor que la fecha de fin')
      return
    }

    setLoading(true)
    setAplicandoFiltros(true)
    try {
      let query = supabase
        .from('rentas')
        .select(`
          *,
          vehiculos(
            descripcion, 
            numero_placa, 
            precio_por_dia,
            tipos_vehiculos(id, descripcion),
            marcas(descripcion),
            modelos(descripcion)
          ),
          clientes(nombre),
          empleados(nombre)
        `)
        .eq('estado', true)
        .gte('fecha_renta', filtros.fechaInicio)
        .lte('fecha_renta', filtros.fechaFin)

      if (!isSuperAdmin && tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      if (estadoRenta) {
        query = query.eq('estado_renta', estadoRenta)
      }
      if (filtros.cliente) {
        query = query.eq('cliente_id', filtros.cliente)
      }
      if (filtros.empleado) {
        query = query.eq('empleado_id', filtros.empleado)
      }

      const { data: rentas, error } = await query

      if (error) {
        console.error('Error en consulta:', error)
        alert('Error al generar el reporte: ' + error.message)
        return
      }

      if (!rentas) {
        setReporteData({
          rentas: [],
          totalRentas: 0,
          ingresoTotal: 0
        })
        return
      }

      let rentasFiltradas = rentas
      if (filtros.tipoVehiculo) {
        rentasFiltradas = rentas.filter(renta => 
          renta.vehiculos?.tipos_vehiculos?.id === filtros.tipoVehiculo
        )
      }

      const totalRentas = rentasFiltradas.length
      const ingresoTotal = rentasFiltradas.reduce((sum, r) => sum + r.monto_total, 0)

      const vehiculoStats = rentasFiltradas.reduce((acc, renta) => {
        const vehiculoId = renta.vehiculo_id
        if (!acc[vehiculoId]) {
          acc[vehiculoId] = {
            vehiculo: renta.vehiculos,
            count: 0,
            ingresos: 0
          }
        }
        acc[vehiculoId].count++
        acc[vehiculoId].ingresos += renta.monto_total
        return acc
      }, {} as any)

      const vehiculoMasRentado = Object.values(vehiculoStats).reduce((max: any, current: any) => 
        !max || current.count > max.count ? current : max, null)

      const clienteStats = rentasFiltradas.reduce((acc, renta) => {
        const clienteId = renta.cliente_id
        if (!acc[clienteId]) {
          acc[clienteId] = {
            cliente: renta.clientes,
            count: 0,
            ingresos: 0
          }
        }
        acc[clienteId].count++
        acc[clienteId].ingresos += renta.monto_total
        return acc
      }, {} as any)

      const clienteFrecuente = Object.values(clienteStats).reduce((max: any, current: any) => 
        !max || current.count > max.count ? current : max, null)

      const empleadoStats = rentasFiltradas.reduce((acc, renta) => {
        const empleadoId = renta.empleado_id
        if (!acc[empleadoId]) {
          acc[empleadoId] = {
            empleado: renta.empleados,
            count: 0,
            ingresos: 0
          }
        }
        acc[empleadoId].count++
        acc[empleadoId].ingresos += renta.monto_total
        return acc
      }, {} as any)

      const empleadoDestacado = Object.values(empleadoStats).reduce((max: any, current: any) => 
        !max || current.count > max.count ? current : max, null)

      setReporteData({
        rentas: rentasFiltradas,
        totalRentas,
        ingresoTotal,
        vehiculoMasRentado,
        clienteFrecuente,
        empleadoDestacado
      })

      console.log('Reporte generado:', {
        totalRentas,
        ingresoTotal,
        rentasFiltradas: rentasFiltradas.length,
        filtrosAplicados: filtros
      })
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error al generar el reporte. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
      setAplicandoFiltros(false)
    }
  }

  function limpiarFiltros() {
    const hoy = new Date()
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    
    setFiltros({
      fechaInicio: primerDia.toISOString().split('T')[0],
      fechaFin: ultimoDia.toISOString().split('T')[0],
      tipoVehiculo: '',
      cliente: '',
      empleado: ''
    })
    setEstadoRenta('')
    setReporteData(null)
  }

  function exportarReporte() {
    if (!reporteData || reporteData.rentas.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    // BOM para UTF-8 (para que Excel reconozca los caracteres especiales)
    const BOM = '\uFEFF'
    
    // Encabezados
    const headers = [
      'Numero de Renta',
      'Fecha de Renta',
      'Cliente',
      'Vehiculo',
      'Placa',
      'Empleado',
      'Cantidad de Dias',
      'Monto por Dia',
      'Monto Total',
      'Estado'
    ]

    // Función para escapar valores CSV
    const escapeCsvValue = (value: any): string => {
      if (value === null || value === undefined) return ''
      const stringValue = String(value)
      // Si contiene coma, comilla o salto de línea, envolver en comillas y escapar comillas internas
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    // Crear filas de datos
    const rows = reporteData.rentas.map(renta => [
      escapeCsvValue(renta.numero_renta),
      escapeCsvValue(new Date(renta.fecha_renta).toLocaleDateString('es-DO')),
      escapeCsvValue(renta.clientes?.nombre || 'N/A'),
      escapeCsvValue(renta.vehiculos?.descripcion || 'N/A'),
      escapeCsvValue(renta.vehiculos?.numero_placa || 'N/A'),
      escapeCsvValue(renta.empleados?.nombre || 'N/A'),
      escapeCsvValue(renta.cantidad_dias),
      escapeCsvValue(renta.monto_por_dia.toFixed(2)),
      escapeCsvValue(renta.monto_total.toFixed(2)),
      escapeCsvValue(renta.estado_renta)
    ])

    // Agregar fila de resumen
    rows.push([]) // Fila vacía
    rows.push(['RESUMEN DEL REPORTE'])
    rows.push(['Total de Rentas:', reporteData.totalRentas])
    rows.push(['Ingresos Total:', `$${reporteData.ingresoTotal.toFixed(2)}`])
    rows.push(['Promedio por Renta:', `$${(reporteData.ingresoTotal / reporteData.totalRentas).toFixed(2)}`])
    
    if (reporteData.vehiculoMasRentado) {
      rows.push([])
      rows.push(['Vehiculo Mas Rentado:', reporteData.vehiculoMasRentado.vehiculo?.descripcion])
      rows.push(['Cantidad de Rentas:', reporteData.vehiculoMasRentado.count])
    }

    if (reporteData.clienteFrecuente) {
      rows.push([])
      rows.push(['Cliente Mas Frecuente:', reporteData.clienteFrecuente.cliente?.nombre])
      rows.push(['Cantidad de Rentas:', reporteData.clienteFrecuente.count])
    }

    if (reporteData.empleadoDestacado) {
      rows.push([])
      rows.push(['Empleado Destacado:', reporteData.empleadoDestacado.empleado?.nombre])
      rows.push(['Cantidad de Rentas:', reporteData.empleadoDestacado.count])
    }

    // Construir CSV
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    const fechaInicio = new Date(filtros.fechaInicio).toLocaleDateString('es-DO').replace(/\//g, '-')
    const fechaFin = new Date(filtros.fechaFin).toLocaleDateString('es-DO').replace(/\//g, '-')
    link.download = `Reporte_Rentas_${fechaInicio}_a_${fechaFin}.csv`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  function exportarPDF() {
    if (!reporteData || reporteData.rentas.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    const fechaInicio = new Date(filtros.fechaInicio).toLocaleDateString('es-DO')
    const fechaFin = new Date(filtros.fechaFin).toLocaleDateString('es-DO')
    
    // Crear ventana de impresión
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para generar el PDF')
      return
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte de Rentas - ${fechaInicio} a ${fechaFin}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    
    .header h1 {
      color: #1e40af;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header .period {
      color: #6b7280;
      font-size: 14px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .summary-card:nth-child(1) {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
    
    .summary-card:nth-child(2) {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    
    .summary-card:nth-child(3) {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    }
    
    .summary-card:nth-child(4) {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }
    
    .summary-card .label {
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    
    .summary-card .value {
      font-size: 24px;
      font-weight: bold;
    }
    
    .highlights {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .highlight-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
    }
    
    .highlight-card h3 {
      color: #1f2937;
      font-size: 14px;
      margin-bottom: 10px;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 5px;
    }
    
    .highlight-card .name {
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 3px;
    }
    
    .highlight-card .detail {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .highlight-card .stats {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .highlight-card .stats span {
      color: #10b981;
      font-weight: bold;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    thead {
      background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
      color: white;
    }
    
    th {
      padding: 12px 8px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
    }
    
    tbody tr:hover {
      background-color: #f9fafb;
    }
    
    tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }
    
    .status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: bold;
    }
    
    .status-activa {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-devuelta {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .status-vencida {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    
    .amount {
      color: #10b981;
      font-weight: bold;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .summary-grid {
        page-break-inside: avoid;
      }
      
      table {
        page-break-inside: auto;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Reporte de Rentas</h1>
    <p class="period">Período: ${fechaInicio} - ${fechaFin}</p>
    <p class="period">Generado el: ${new Date().toLocaleString('es-DO')}</p>
  </div>
  
  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Total Rentas</div>
      <div class="value">${reporteData.totalRentas}</div>
    </div>
    <div class="summary-card">
      <div class="label">Ingresos Total</div>
      <div class="value">${reporteData.ingresoTotal.toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Promedio/Renta</div>
      <div class="value">${(reporteData.ingresoTotal / reporteData.totalRentas).toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Días Totales</div>
      <div class="value">${reporteData.rentas.reduce((sum, r) => sum + r.cantidad_dias, 0)}</div>
    </div>
  </div>
  
  <div class="highlights">
    ${reporteData.vehiculoMasRentado ? `
    <div class="highlight-card">
      <h3>🚗 Vehículo Más Rentado</h3>
      <div class="name">${reporteData.vehiculoMasRentado.vehiculo?.descripcion || 'N/A'}</div>
      <div class="detail">${reporteData.vehiculoMasRentado.vehiculo?.numero_placa || ''}</div>
      <div class="stats">
        <span>${reporteData.vehiculoMasRentado.count} rentas</span>
        <span>${reporteData.vehiculoMasRentado.ingresos.toFixed(2)}</span>
      </div>
    </div>
    ` : ''}
    
    ${reporteData.clienteFrecuente ? `
    <div class="highlight-card">
      <h3>👤 Cliente Más Frecuente</h3>
      <div class="name">${reporteData.clienteFrecuente.cliente?.nombre || 'N/A'}</div>
      <div class="detail">${reporteData.clienteFrecuente.cliente?.cedula || ''}</div>
      <div class="stats">
        <span>${reporteData.clienteFrecuente.count} rentas</span>
        <span>${reporteData.clienteFrecuente.ingresos.toFixed(2)}</span>
      </div>
    </div>
    ` : ''}
    
    ${reporteData.empleadoDestacado ? `
    <div class="highlight-card">
      <h3>⭐ Empleado Destacado</h3>
      <div class="name">${reporteData.empleadoDestacado.empleado?.nombre || 'N/A'}</div>
      <div class="detail">${reporteData.empleadoDestacado.empleado?.cedula || ''}</div>
      <div class="stats">
        <span>${reporteData.empleadoDestacado.count} rentas</span>
        <span>${reporteData.empleadoDestacado.ingresos.toFixed(2)}</span>
      </div>
    </div>
    ` : ''}
  </div>
  
  <h2 style="color: #1f2937; margin-top: 30px; margin-bottom: 15px; font-size: 18px;">Detalle de Rentas</h2>
  
  <table>
    <thead>
      <tr>
        <th>Número</th>
        <th>Fecha</th>
        <th>Cliente</th>
        <th>Vehículo</th>
        <th>Empleado</th>
        <th>Días</th>
        <th>Total</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${reporteData.rentas.map(renta => `
        <tr>
          <td>${renta.numero_renta}</td>
          <td>${new Date(renta.fecha_renta).toLocaleDateString('es-DO')}</td>
          <td>${renta.clientes?.nombre || 'N/A'}</td>
          <td>${renta.vehiculos?.descripcion || 'N/A'} - ${renta.vehiculos?.numero_placa || ''}</td>
          <td>${renta.empleados?.nombre || 'N/A'}</td>
          <td>${renta.cantidad_dias}</td>
          <td class="amount">${renta.monto_total.toFixed(2)}</td>
          <td>
            <span class="status status-${renta.estado_renta.toLowerCase()}">
              ${renta.estado_renta}
            </span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p><strong>Sistema de Gestión de Rentas de Vehículos</strong></p>
    <p>Este documento es un reporte generado automáticamente</p>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() {
        window.close();
      }
    }
  </script>
</body>
</html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reportes y Consultas</h1>
        <div className="flex gap-2">
          <Button onClick={exportarPDF} disabled={!reporteData || reporteData.rentas.length === 0} variant="secondary">
            <FileText className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={exportarReporte} disabled={!reporteData || reporteData.rentas.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Filtros de Consulta</h2>
          <div className="flex space-x-2">
            <Button 
              onClick={limpiarFiltros} 
              variant="secondary" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
            <Button 
              onClick={generarReporte} 
              disabled={loading || aplicandoFiltros}
              size="sm"
            >
              {aplicandoFiltros ? (
                <LoadingSpinner />
              ) : (
                <>
                  <Filter className="w-4 h-4 mr-2" />
                  Aplicar Filtros
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Fecha Inicio"
            type="date"
            value={filtros.fechaInicio}
            onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
            required
          />
          <Input
            label="Fecha Fin"
            type="date"
            value={filtros.fechaFin}
            onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
            required
          />
          <Select
            label="Tipo de Vehículo"
            value={filtros.tipoVehiculo}
            onChange={(e) => setFiltros({ ...filtros, tipoVehiculo: e.target.value })}
            options={tiposVehiculo.map(tipo => ({ value: tipo.id, label: tipo.descripcion }))}
          />
          <Select
            label="Cliente"
            value={filtros.cliente}
            onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
            options={clientes.map(cliente => ({ value: cliente.id, label: cliente.nombre }))}
          />
          <Select
            label="Empleado"
            value={filtros.empleado}
            onChange={(e) => setFiltros({ ...filtros, empleado: e.target.value })}
            options={empleados.map(empleado => ({ value: empleado.id, label: empleado.nombre }))}
          />
          <Select
            label="Estado de Renta"
            value={estadoRenta}
            onChange={(e) => setEstadoRenta(e.target.value)}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'Activa', label: 'Activas' },
              { value: 'Devuelta', label: 'Devueltas' },
              { value: 'Vencida', label: 'Vencidas' }
            ]}
          />
        </div>

        {filtros.fechaInicio && filtros.fechaFin && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Período seleccionado:</strong> {new Date(filtros.fechaInicio).toLocaleDateString('es-DO')} - {new Date(filtros.fechaFin).toLocaleDateString('es-DO')}
              {filtros.tipoVehiculo && <span> | <strong>Tipo:</strong> {tiposVehiculo.find(t => t.id === filtros.tipoVehiculo)?.descripcion}</span>}
              {filtros.cliente && <span> | <strong>Cliente:</strong> {clientes.find(c => c.id === filtros.cliente)?.nombre}</span>}
              {filtros.empleado && <span> | <strong>Empleado:</strong> {empleados.find(e => e.id === filtros.empleado)?.nombre}</span>}
              {estadoRenta && <span> | <strong>Estado:</strong> {estadoRenta}</span>}
            </p>
          </div>
        )}
      </div>

      {reporteData && (
        <>
          {/* Estadísticas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-500 text-white rounded-xl p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 mr-3" />
                <div>
                  <p className="text-sm opacity-80">Total Rentas</p>
                  <p className="text-2xl font-bold">{reporteData.totalRentas}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-500 text-white rounded-xl p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 mr-3" />
                <div>
                  <p className="text-sm opacity-80">Ingresos Total</p>
                  <p className="text-2xl font-bold">${reporteData.ingresoTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-500 text-white rounded-xl p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 mr-3" />
                <div>
                  <p className="text-sm opacity-80">Promedio por Renta</p>
                  <p className="text-2xl font-bold">
                    ${reporteData.totalRentas > 0 ? (reporteData.ingresoTotal / reporteData.totalRentas).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-500 text-white rounded-xl p-6">
              <div className="flex items-center">
                <Car className="w-8 h-8 mr-3" />
                <div>
                  <p className="text-sm opacity-80">Días Totales</p>
                  <p className="text-2xl font-bold">
                    {reporteData.rentas.reduce((sum, r) => sum + r.cantidad_dias, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas Detalladas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {reporteData.vehiculoMasRentado && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehículo Más Rentado</h3>
                <div className="space-y-2">
                  <p className="font-medium">{reporteData.vehiculoMasRentado.vehiculo.descripcion}</p>
                  <p className="text-sm text-gray-600">{reporteData.vehiculoMasRentado.vehiculo.numero_placa}</p>
                  <div className="flex justify-between text-sm">
                    <span>Rentas:</span>
                    <span className="font-semibold">{reporteData.vehiculoMasRentado.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ingresos:</span>
                    <span className="font-semibold text-green-600">
                      ${reporteData.vehiculoMasRentado.ingresos.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {reporteData.clienteFrecuente && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cliente Más Frecuente</h3>
                <div className="space-y-2">
                  <p className="font-medium">{reporteData.clienteFrecuente.cliente.nombre}</p>
                  <p className="text-sm text-gray-600">{reporteData.clienteFrecuente.cliente.cedula}</p>
                  <div className="flex justify-between text-sm">
                    <span>Rentas:</span>
                    <span className="font-semibold">{reporteData.clienteFrecuente.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gasto Total:</span>
                    <span className="font-semibold text-green-600">
                      ${reporteData.clienteFrecuente.ingresos.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {reporteData.empleadoDestacado && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Empleado Destacado</h3>
                <div className="space-y-2">
                  <p className="font-medium">{reporteData.empleadoDestacado.empleado.nombre}</p>
                  <p className="text-sm text-gray-600">{reporteData.empleadoDestacado.empleado.cedula}</p>
                  <div className="flex justify-between text-sm">
                    <span>Rentas:</span>
                    <span className="font-semibold">{reporteData.empleadoDestacado.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ventas:</span>
                    <span className="font-semibold text-green-600">
                      ${reporteData.empleadoDestacado.ingresos.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de Rentas */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalle de Rentas ({reporteData.rentas.length} registros)
                </h3>
                <div className="text-sm text-gray-600">
                  Total: ${reporteData.ingresoTotal.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vehículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Días
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporteData.rentas.map((renta) => (
                    <tr key={renta.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {renta.numero_renta}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(renta.fecha_renta).toLocaleDateString('es-DO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renta.clientes?.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renta.vehiculos?.descripcion} - {renta.vehiculos?.numero_placa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renta.empleados?.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renta.cantidad_dias}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ${renta.monto_total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          renta.estado_renta === 'Activa' 
                            ? 'bg-green-100 text-green-800'
                            : renta.estado_renta === 'Devuelta'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {renta.estado_renta}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {reporteData && reporteData.rentas.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron rentas</h3>
          <p className="text-gray-600">
            No hay rentas que coincidan con los filtros seleccionados.
            Intenta ajustar las fechas o remover algunos filtros.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-2 text-gray-600">Generando reporte...</p>
          </div>
        </div>
      )}
    </div>
  )
}