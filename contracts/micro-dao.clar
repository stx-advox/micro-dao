
;; micro-dao
;;
;; Small contract to manage a simple DAO structure for small teams

;; constants
;;

;; 5 days before an action could be executed if no dissent was put up
(define-constant DISSENT_EXPIRY (* 144 5))

;; initial members of dao
(define-constant INITIAL_MEMBERS (list contract-caller))

;; data maps and vars
;;

;; members of the DAO who could create funding proposals and manage their balances

;; Funding proposals where we store funding proposals

;; vouch proposals

;; private functions
;;

;; public functions
;;

;; get balance


(define-read-only (get-balance) 
    (ok (stx-get-balance (as-contract tx-sender))))

;; propose to add new member

;; propose a new funding proposal

;; vote to support funding proposal

;; vote to support adding a new member

;; exit dao
