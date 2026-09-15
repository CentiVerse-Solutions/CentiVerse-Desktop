/**
 * Shared framer-motion variants for the group screen.
 *
 * These are static constants, not state -- they were sitting inside
 * useGroupDetails purely because that is where the component body happened
 * to declare them. Moving them out is behaviour-preserving.
 */
export const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            staggerChildren: 0.1
        }
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

export const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

export const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 25
        }
    },
    hover: {
        y: -5,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        transition: { type: "spring", stiffness: 400, damping: 25 }
    },
    tap: { scale: 0.98 }
};
