package com.matheusfinance.push;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscriptionEntity, Long> {
    List<PushSubscriptionEntity> findAllByPerfilId(Long perfilId);
    Optional<PushSubscriptionEntity> findByPerfilIdAndEndpoint(Long perfilId, String endpoint);
    void deleteByPerfilIdAndEndpoint(Long perfilId, String endpoint);
}
