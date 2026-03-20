from django.db import models

class Lote(models.Model):
    codigo_lote = models.CharField(max_length=50, unique=True)
    raza = models.CharField(max_length=100)
    cantidad_inicial = models.IntegerField(default=0)
    cantidad_actual = models.IntegerField(default=0)
    cantidad_bajas = models.IntegerField(default=0)
    costo_unidad = models.FloatField(default=0.0)
    gastos_alimento = models.FloatField(default=0.0)
    fecha_ingreso = models.DateField(auto_now_add=True)
    notas = models.TextField(blank=True, null=True)
    vacunado = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.codigo_lote