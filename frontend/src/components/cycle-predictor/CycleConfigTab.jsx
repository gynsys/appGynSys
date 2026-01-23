import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import Button from '../common/Button'
import { Settings, Save, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import { toast } from 'sonner'

export default function CycleConfigTab() {
    const { user, setUser } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        cycle_avg_length: 28,
        period_avg_length: 5
    })

    useEffect(() => {
        if (user) {
            setFormData({
                cycle_avg_length: user.cycle_avg_length || 28,
                period_avg_length: user.period_avg_length || 5
            })
        }
    }, [user])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const updatedUser = await authService.updateCycleUser(formData)
            setUser(updatedUser) // Update store with new data
            toast.success("Configuración actualizada correctamente")
        } catch (error) {
            console.error("Error updating settings:", error)
            toast.error("Error al guardar la configuración")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        // Ensure integer values
        const intValue = parseInt(value) || 0
        setFormData(prev => ({ ...prev, [name]: intValue }))
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuración del Ciclo
                </CardTitle>
                <CardDescription>
                    Personaliza los valores predeterminados para predicciones más precisas
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="cycle_avg_length">Duración promedio del ciclo (días)</Label>
                        <Input
                            id="cycle_avg_length"
                            name="cycle_avg_length"
                            type="number"
                            min="20"
                            max="45"
                            value={formData.cycle_avg_length}
                            onChange={handleChange}
                            className="max-w-[120px]"
                        />
                        <p className="text-sm text-muted-foreground">
                            Normalmente entre 21 y 35 días. El promedio es 28 días.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="period_avg_length">Duración promedio del período (días)</Label>
                        <Input
                            id="period_avg_length"
                            name="period_avg_length"
                            type="number"
                            min="1"
                            max="10"
                            value={formData.period_avg_length}
                            onChange={handleChange}
                            className="max-w-[120px]"
                        />
                        <p className="text-sm text-muted-foreground">
                            Normalmente entre 3 y 7 días. El promedio es 5 días.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full sm:w-auto bg-pink-500 hover:bg-pink-600 text-white"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
