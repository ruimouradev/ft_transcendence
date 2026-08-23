// As chaves da API pública: mostra o estado atual e gera chaves novas.
// A chave só se vê no momento em que nasce, o servidor não a guarda
// em claro, por isso o aviso para a copiar é a sério.
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Tooltip,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CheckCircle,
  ContentCopy,
  Key,
  LibraryBooks,
  Refresh,
  WarningAmber,
} from "@mui/icons-material";
import { api } from "../core/client";

interface ApiKeyStatus {
  has_api_key: boolean;
  client_id?: string;
}

// um campo so de leitura com o botao de copiar ao lado, usado para o
// client id e para a chave
function CopyField({ label, value, copied, onCopy }: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <TextField
      label={label}
      value={value}
      fullWidth
      slotProps={{
        input: {
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={onCopy}>
                {copied ? <CheckCircle color="success" /> : <ContentCopy />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

interface ApiKeyResponse {
  api_key: string;
  client_id: string;
}

export default function ApiKeyPage() {
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);
  const [newKey, setNewKey] = useState<ApiKeyResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // corre uma vez, ao abrir a pagina; o loading ja nasce a true
  useEffect(() => {
    const loadApiKeyStatus = async () => {
      try {
        const response = await api.get<ApiKeyStatus>("/users/apikey");
        setStatus(response.data);
      } catch {
        setError("Failed to load API key status.");
      } finally {
        setLoading(false);
      }
    };
    loadApiKeyStatus();
  }, []);

  const generateApiKey = async () => {
    try {
      setGenerating(true);
      setError(null);

      const response = await api.post<ApiKeyResponse>("/users/apikey");

      // a chave vive apenas no estado do React: um refresh e desaparece,
      // tal como o ecrã avisa
      setNewKey(response.data);

      setStatus({
        has_api_key: true,
        client_id: response.data.client_id,
      });
    } catch {
      setError("Failed to generate API key.");
    } finally {
      setGenerating(false);
    }
  };

  // o browser pode recusar o acesso ao clipboard, e nesse caso o visto
  // de copiado simplesmente não aparece
  const copyToClipboard = async (value: string, type: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }

    setCopied(type);

    setTimeout(() => {
      setCopied(null);
    }, 2000);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 760,
        mx: "auto",
        px: 2,
        py: 4,
      }}
    >
      <Stack spacing={3}>
        {/* o cabecalho da pagina */}
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            API Key
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Manage your API credentials for accessing the UNO API.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {/* a chave acabada de gerar, so visivel neste momento */}
        {newKey ? (
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <CheckCircle color="success" />

                    <Typography variant="h6">
                      API Key Generated
                    </Typography>
                    <Tooltip title="View API documentation">
                      <IconButton href="/docs" target="_blank" rel="noopener noreferrer">
                        <LibraryBooks color="primary" />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Your API key has been generated successfully.
                  </Typography>
                </Box>

                <Alert
                  severity="warning"
                  icon={<WarningAmber />}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Save your API key now.
                  </Typography>

                  <Typography variant="body2">
                    For security reasons, this API key will only be shown
                    once. You will not be able to view it again.
                  </Typography>
                </Alert>

                <Divider />

                <CopyField
                  label="Client ID"
                  value={newKey.client_id}
                  copied={copied === "client_id"}
                  onCopy={() => copyToClipboard(newKey.client_id, "client_id")}
                />

                <CopyField
                  label="API Key"
                  value={newKey.api_key}
                  copied={copied === "api_key"}
                  onCopy={() => copyToClipboard(newKey.api_key, "api_key")}
                />

                <Alert severity="info">
                  Once you leave or refresh this page, the API key will no
                  longer be displayed.
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          /* o estado da chave que ja existe */
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "center" }}
                  >
                    <Key color="primary" />

                    <Typography variant="h6">
                      API Credentials
                    </Typography>
                  </Stack>

                  {status?.has_api_key ? (<>
                    <Chip
                      label="Active"
                      color="success"
                      icon={<CheckCircle />}
                    />

                    <Tooltip title="View API documentation">
                      <IconButton href="/docs" target="_blank" rel="noopener noreferrer">
                        <LibraryBooks color="primary" />
                      </IconButton>
                    </Tooltip>
                  </>
                  ) : (
                    <Chip
                      label="Not configured"
                      color="default"
                    />
                  )}
                </Stack>

                <Divider />

                {status?.has_api_key ? (
                  <>
                    <Alert severity="success">
                      You already have an active API key.
                    </Alert>

                    {status.client_id && (
                      <CopyField
                        label="Client ID"
                        value={status.client_id}
                        copied={copied === "existing_client_id"}
                        onCopy={() => copyToClipboard(status.client_id!, "existing_client_id")}
                      />
                    )}

                    <Alert severity="warning">
                      Your API key cannot be displayed again. If you lost
                      it, generate a new API key.
                    </Alert>

                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<Refresh />}
                      onClick={generateApiKey}
                      disabled={generating}
                    >
                      {generating
                        ? "Generating..."
                        : "Generate New API Key"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Alert severity="info">
                      You don't currently have an API key.
                    </Alert>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Generate an API key to access the protected API
                      endpoints.
                    </Typography>

                    <Button
                      variant="contained"
                      startIcon={<Key />}
                      onClick={generateApiKey}
                      disabled={generating}
                    >
                      {generating
                        ? "Generating..."
                        : "Generate API Key"}
                    </Button>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}