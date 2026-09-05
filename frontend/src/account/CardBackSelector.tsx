import { useState } from "react";
import { Box, ButtonBase, Popover } from "@mui/material";
import type { CardBackSelectorProps } from '../core/types.ts'

function CardBackSelector({ cardBacks, value, onChange, cardWidth = 80, cardHeight = 112, optionWidth = 60, columns = 4 }: CardBackSelectorProps)
{
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (cardBack: string) => {
        onChange(cardBack);
        handleClose();
    };

    return (
        <>
            <ButtonBase onClick={handleOpen} sx={{ borderRadius: 2, overflow: "hidden", transition: "transform 0.15s ease", "&:hover": { transform: "scale(1.05)" } }}>
                <Box component="img" src={value} alt="Chosen card back" sx={{ width: cardWidth, height: cardHeight, objectFit: "cover", display: "block" }}/>
            </ButtonBase>

            <Popover open={open} anchorEl={anchorEl} onClose={handleClose} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
				transformOrigin={{ vertical: "top", horizontal: "left" }}>
                <Box sx={{ p: 2, display: "grid", gridTemplateColumns: `repeat(${columns}, ${optionWidth}px)`, gap: 1.5 }}>
                    {cardBacks.map((cardBack) => {
                        const selected = cardBack === value;
                        return (
                            <ButtonBase key={cardBack} onClick={() => handleSelect(cardBack)}
								sx={{ borderRadius: 1.5, overflow: "hidden", border: "3px solid", borderColor: selected ? "primary.main" : "transparent",
								transition: "all 0.15s ease", "&:hover": { transform: "scale(1.08)" } }}>
                                <Box component="img" src={cardBack} alt="Card back option" sx={{ width: optionWidth, height: optionWidth * 1.4, objectFit: "cover", display: "block" }}/>
                            </ButtonBase>
                        );
                    })}
                </Box>
            </Popover>
        </>
    );
}

export default CardBackSelector