"""
Script para migrar Custom Claims a usuarios existentes

Este script:
1. Lee todos los usuarios de Firestore
2. Para cada usuario, busca su tienda asociada
3. Setea los custom claims (storeId, role) en Firebase Auth
4. Revoca tokens para forzar refresh

Ejecutar una sola vez para migrar usuarios existentes.

Requisitos:
- pip install firebase-admin
- Archivo credenciales.json con las credenciales del proyecto
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth
import json
from datetime import datetime


# --- CONFIGURACIÓN ---
CREDENTIAL_FILE = "credenciales.json"


# --- INICIO ---
if not firebase_admin._apps:
    cred = credentials.Certificate(CREDENTIAL_FILE)
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("=" * 60)
print("🔐 MIGRACIÓN DE CUSTOM CLAIMS")
print("=" * 60)
print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()


def get_all_stores():
    """Obtiene todas las tiendas y las indexa por ownerId"""
    print("📦 Cargando tiendas...")
    stores_ref = db.collection('stores')
    stores = {}
    
    for doc in stores_ref.stream():
        data = doc.to_dict()
        owner_id = data.get('ownerId')
        if owner_id:
            stores[owner_id] = {
                'storeId': doc.id,
                'storeName': data.get('basicInfo', {}).get('name', 'Sin nombre')
            }
    
    print(f"   ✅ {len(stores)} tiendas encontradas")
    return stores


def get_user_current_claims(uid):
    """Obtiene los claims actuales de un usuario"""
    try:
        user = auth.get_user(uid)
        return user.custom_claims or {}
    except Exception as e:
        print(f"   ⚠️ Error obteniendo claims de {uid}: {e}")
        return {}


def set_user_claims(uid, claims):
    """Setea custom claims para un usuario"""
    try:
        auth.set_custom_user_claims(uid, claims)
        return True
    except Exception as e:
        print(f"   ❌ Error seteando claims para {uid}: {e}")
        return False


def revoke_user_tokens(uid):
    """Revoca todos los tokens del usuario para forzar refresh"""
    try:
        auth.revoke_refresh_tokens(uid)
        return True
    except Exception as e:
        print(f"   ⚠️ Error revocando tokens de {uid}: {e}")
        return False


def migrate_claims():
    """Función principal de migración"""
    
    # 1. Cargar todas las tiendas
    stores_by_owner = get_all_stores()
    
    # 2. Procesar usuarios
    print()
    print("👥 Procesando usuarios...")
    print("-" * 60)
    
    users_ref = db.collection('users')
    
    stats = {
        'total': 0,
        'migrated': 0,
        'already_has_claims': 0,
        'no_store': 0,
        'errors': 0
    }
    
    results = []
    
    for user_doc in users_ref.stream():
        user_id = user_doc.id
        user_data = user_doc.to_dict()
        email = user_data.get('email', 'N/A')
        
        stats['total'] += 1
        print(f"\n👤 Usuario: {email}")
        print(f"   ID: {user_id}")
        
        # Verificar claims actuales
        current_claims = get_user_current_claims(user_id)
        
        if current_claims.get('storeId'):
            print(f"   ✅ Ya tiene claims: storeId={current_claims.get('storeId')}, role={current_claims.get('role')}")
            stats['already_has_claims'] += 1
            results.append({
                'userId': user_id,
                'email': email,
                'status': 'already_has_claims',
                'storeId': current_claims.get('storeId'),
                'role': current_claims.get('role')
            })
            continue
        
        # Buscar tienda asociada
        store_info = stores_by_owner.get(user_id)
        
        if not store_info:
            print(f"   ⚠️ No tiene tienda asociada")
            stats['no_store'] += 1
            results.append({
                'userId': user_id,
                'email': email,
                'status': 'no_store',
                'storeId': None,
                'role': None
            })
            continue
        
        # Preparar claims
        new_claims = {
            'storeId': store_info['storeId'],
            'role': 'owner'  # Por defecto, owner de su tienda
        }
        
        print(f"   🏪 Tienda encontrada: {store_info['storeName']} ({store_info['storeId']})")
        print(f"   📝 Seteando claims: {new_claims}")
        
        # Setear claims
        if set_user_claims(user_id, new_claims):
            print(f"   ✅ Claims seteados correctamente")
            
            # Revocar tokens para forzar refresh
            if revoke_user_tokens(user_id):
                print(f"   🔄 Tokens revocados (usuario debe re-login)")
            
            stats['migrated'] += 1
            results.append({
                'userId': user_id,
                'email': email,
                'status': 'migrated',
                'storeId': store_info['storeId'],
                'role': 'owner'
            })
        else:
            stats['errors'] += 1
            results.append({
                'userId': user_id,
                'email': email,
                'status': 'error',
                'storeId': None,
                'role': None
            })
    
    # 3. Resumen
    print()
    print("=" * 60)
    print("📊 RESUMEN DE MIGRACIÓN")
    print("=" * 60)
    print(f"   Total usuarios:        {stats['total']}")
    print(f"   ✅ Migrados:           {stats['migrated']}")
    print(f"   ✅ Ya tenían claims:   {stats['already_has_claims']}")
    print(f"   ⚠️ Sin tienda:         {stats['no_store']}")
    print(f"   ❌ Errores:            {stats['errors']}")
    print()
    
    # 4. Guardar log
    log_filename = f"migration_claims_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(log_filename, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'stats': stats,
            'results': results
        }, f, ensure_ascii=False, indent=2)
    
    print(f"📄 Log guardado en: {log_filename}")
    print()
    
    if stats['migrated'] > 0:
        print("⚠️  IMPORTANTE: Los usuarios migrados deben cerrar sesión y volver a entrar")
        print("    para que los nuevos claims tomen efecto.")
    
    return stats


# --- EJECUCIÓN ---
if __name__ == "__main__":
    try:
        print("¿Deseas ejecutar la migración? (s/n): ", end="")
        response = input().strip().lower()
        
        if response == 's':
            migrate_claims()
        else:
            print("❌ Migración cancelada")
    except KeyboardInterrupt:
        print("\n❌ Migración cancelada por el usuario")
    except Exception as e:
        print(f"\n❌ Error fatal: {e}")
        import traceback
        traceback.print_exc()
