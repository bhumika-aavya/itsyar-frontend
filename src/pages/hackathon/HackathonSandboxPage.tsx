import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import HackathonCodeSandbox from './HackathonCodeSandbox';

export default function HackathonSandboxPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const hackathonStatus = (location.state as any)?.hackathonStatus ?? 'Running';

    if (!id) return null;

    return (
        <HackathonCodeSandbox
            hackathonId={id}
            hackathonStatus={hackathonStatus}
            initialFullscreen={true}
            onClose={() => navigate(`/hackathons/${id}`, { replace: true })}
        />
    );
}
