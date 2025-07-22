import {
  Box,
  FormControl,
  FormLabel,
  Slider,
  Stack,
} from "@mui/material";
import { useConfigurator } from "../contexts/Configurator";
export const Interface = () => {
  const { fenceCount, setFenceCount, fenceWidth, setFenceWidth, postGap, setPostGap } =
    useConfigurator();

  // When postGap changes, update fenceWidth so all gaps are even
  const handlePostGapChange = (e) => {
    const newGap = Number(e.target.value);
    setPostGap(newGap);
    // Calculate the largest number of even gaps that fit in the current fenceWidth
    const gapCount = Math.max(1, Math.round(fenceWidth / newGap));
    setFenceWidth(gapCount * newGap);
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        overflow: "auto",
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "column",
      }}
      p={3}
    >
      <Stack spacing={3}>
        <Box className="glass" p={3}>
          <FormControl>
            <FormLabel>Paneelide kogus</FormLabel>
            <Slider
              sx={{
                width: "200px",
              }}
              min={1}
              max={10}
              value={fenceCount}
              step={1}
              onChange={(e) => setFenceCount(Number(e.target.value))}
              valueLabelDisplay="auto"
            />
          </FormControl>
        </Box>
        <Box className="glass" p={3}>
          <FormControl>
            <FormLabel>Paneeli laius (cm)</FormLabel>
            <Slider
              sx={{
                width: "200px",
              }}
              min={150}
              max={300}
              value={fenceWidth}
              step={postGap}
              onChange={(e) => setFenceWidth(Number(e.target.value))}
              valueLabelDisplay="auto"
            />
          </FormControl>
        </Box>
        <Box className="glass" p={3}>
          <FormControl>
            <FormLabel>Aialippide vahe (cm)</FormLabel>
            <Slider
              sx={{
                width: "200px",
              }}
              min={15}
              max={30}
              value={postGap}
              onChange={handlePostGapChange}
              valueLabelDisplay="auto"
            />
          </FormControl>
        </Box>
      </Stack>
    </Box>
  );
};
